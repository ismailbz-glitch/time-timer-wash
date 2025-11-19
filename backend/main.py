
import asyncio
import json
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any

# --- Configuration ---
SIMULATION_TICK_RATE_SECONDS = 1.0

# --- Bioreactor Simulator ---

class BioreactorSimulator:
    def __init__(self):
        self.state = {
            "Temp": {"PV": 37.0, "SP": 37.0},
            "pH": {"PV": 7.0, "SP": 7.0},
            "DO": {"PV": 60.0, "SP": 60.0},
            "Agit": {"PV": 300, "SP": 300},
            "Air": {"PV": 1.0, "SP": 1.0},
            "FeedA": {"PV": 0.0, "SP": 0.0},
            "FeedB": {"PV": 0.0, "SP": 0.0},
        }
        self.safety_limits = {
            "Temp": (25.0, 45.0),
            "pH": (6.0, 8.0),
            "DO": (0.0, 100.0),
            "Agit": (50, 800),
            "Air": (0.1, 5.0),
            "FeedA": (0.0, 10.0),
            "FeedB": (0.0, 10.0),
        }
        self.dynamics = {
            "Temp": 0.1,
            "pH": 0.05,
            "DO": 0.5,
            "Agit": 10,
            "Air": 0.2,
            "FeedA": 1.0,
            "FeedB": 1.0,
        }

    async def update(self):
        while True:
            for param, values in self.state.items():
                sp = values["SP"]
                pv = values["PV"]
                rate = self.dynamics[param]

                # Simple first-order dynamics approximation
                error = sp - pv
                change = error * rate * (SIMULATION_TICK_RATE_SECONDS / 10.0)

                # Add some random noise
                noise = (random.random() - 0.5) * (sp * 0.01) # 1% noise

                new_pv = pv + change + noise
                self.state[param]["PV"] = round(new_pv, 2)

            await asyncio.sleep(SIMULATION_TICK_RATE_SECONDS)

    def read_parameters(self, parameters: List[str]) -> Dict[str, float]:
        readings = {}
        for param in parameters:
            if param in self.state:
                readings[param] = self.state[param]["PV"]
            else:
                raise ValueError(f"Unknown parameter: {param}")
        return readings

    def write_parameters(self, values: Dict[str, float]) -> Dict[str, str]:
        results = {}
        for param, value in values.items():
            if param not in self.state:
                results[param] = f"Error: Unknown parameter {param}"
                continue

            min_val, max_val = self.safety_limits[param]
            clipped_value = max(min_val, min(max_val, value))

            self.state[param]["SP"] = clipped_value

            if value != clipped_value:
                results[param] = f"Success (Clipped from {value} to {clipped_value})"
            else:
                results[param] = "Success"
        return results

# --- FastAPI Application ---

app = FastAPI(
    title="Bioreactor Control API",
    description="An API to control a simulated bioreactor, inspired by TJX Bioengineering demos.",
    version="1.0.0"
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Singleton Simulator Instance ---
bioreactor = BioreactorSimulator()

# --- Background Task for Simulation ---
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(bioreactor.update())
    print("Bioreactor simulation started.")


# --- Pydantic Models ---
class ReadRequest(BaseModel):
    parameters: List[str]

class WriteRequest(BaseModel):
    values: Dict[str, float]

class LLMPlanRequest(BaseModel):
    prompt: str

class PlanStep(BaseModel):
    type: str
    parameters: List[str] = None
    values: Dict[str, float] = None
    seconds: int = None

class ExecutionPlan(BaseModel):
    steps: List[PlanStep]
    allow_on_success: bool = True
    note: str

# --- API Endpoints ---

@app.get("/status", summary="Get full bioreactor status")
async def get_status():
    """Returns the current state (PV and SP) of all parameters."""
    return bioreactor.state

@app.post("/read_multi_real", summary="Read multiple parameters")
async def read_multi_real(request: ReadRequest):
    """Reads the present values (PV) of a list of specified parameters."""
    try:
        return bioreactor.read_parameters(request.parameters)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/write_multi_real", summary="Write multiple parameters")
async def write_multi_real(request: WriteRequest):
    """Writes new setpoints (SP) for multiple specified parameters."""
    return bioreactor.write_parameters(request.values)

@app.post("/llm/plan", summary="Generate a JSON plan from a prompt")
async def generate_llm_plan(request: LLMPlanRequest):
    """
    (Mock) Simulates an LLM generating a structured JSON plan.
    Returns a pre-defined plan for demonstration.
    """
    mock_plan = {
        "steps": [
            {"type": "read", "parameters": ["DO", "Temp"]},
            {"type": "write", "values": {"Agit": 400, "Air": 1.5}},
            {"type": "wait", "seconds": 10},
            {"type": "write", "values": {"Agit": 350, "Air": 1.0}},
        ],
        "allow_on_success": True,
        "note": "This is a mock plan to ramp up agitation and aeration temporarily."
    }
    return mock_plan

@app.post("/execute_plan", summary="Execute a structured plan")
async def execute_plan(plan: ExecutionPlan):
    """Executes a sequence of operations (read, write, wait)."""
    results = []
    for i, step in enumerate(plan.steps):
        step_result = {"step": i + 1, "type": step.type}
        try:
            if step.type == "read":
                readings = bioreactor.read_parameters(step.parameters)
                step_result["status"] = "Success"
                step_result["details"] = readings
            elif step.type == "write":
                write_status = bioreactor.write_parameters(step.values)
                step_result["status"] = "Success"
                step_result["details"] = write_status
            elif step.type == "wait":
                await asyncio.sleep(step.seconds)
                step_result["status"] = "Success"
                step_result["details"] = f"Waited for {step.seconds} seconds."
            else:
                step_result["status"] = "Error"
                step_result["details"] = f"Unknown step type: {step.type}"
                raise HTTPException(status_code=400, detail=f"Unknown step type: {step.type}")

            results.append(step_result)

        except Exception as e:
            step_result["status"] = "Error"
            step_result["details"] = str(e)
            results.append(step_result)
            raise HTTPException(status_code=500, detail={"log": results})

    return {"message": "Plan executed successfully", "log": results}


@app.get("/control_loops", summary="Get status of control loops")
async def get_control_loops():
    """(Placeholder) Returns the status of active control loops."""
    # In a real system, this would manage PID loops, etc.
    return {"active_loops": [], "status": "No active closed-loop controllers."}

# --- Main execution ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
