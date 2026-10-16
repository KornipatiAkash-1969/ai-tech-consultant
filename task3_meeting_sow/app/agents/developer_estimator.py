from typing import List, Tuple
from ..models import ClientRequirement, DeveloperTask

class DeveloperEstimatorAgent:
    """Agent 3: Deconstructs requirements into developer tasks with domain hours breakdown"""

    def generate_task_breakdown(self, requirements: List[ClientRequirement]) -> Tuple[List[DeveloperTask], float, float, float, float]:
        tasks: List[DeveloperTask] = []
        task_id = 1
        total_hours = 0.0
        total_savings = 0.0

        for req in requirements:
            total_savings += req.cost_savings_usd
            hours = req.estimated_hours

            if req.solution_type == "built_in_setting":
                # Admin setup + QA
                cfg_hrs = round(hours * 0.7, 1)
                qa_hrs = round(hours * 0.3, 1)
                tasks.append(DeveloperTask(
                    id=f"DEV-{task_id:03d}",
                    requirement_id=req.id,
                    title=f"Configure Native Setting: {req.title}",
                    domain="backend",
                    description=f"Admin configuration under '{req.bd_feature_ref}'. Zero custom code required.",
                    hours=cfg_hrs
                ))
                task_id += 1
                tasks.append(DeveloperTask(
                    id=f"DEV-{task_id:03d}",
                    requirement_id=req.id,
                    title=f"Smoke Test & Verification: {req.title}",
                    domain="qa",
                    description=f"Validate '{req.title}' workflows in sandbox and staging environments.",
                    hours=qa_hrs
                ))
                task_id += 1

            elif req.solution_type == "hybrid_tweak":
                # Configuration + Custom Widget UI + QA
                tasks.append(DeveloperTask(
                    id=f"DEV-{task_id:03d}",
                    requirement_id=req.id,
                    title=f"Custom Widget & CSS Styling: {req.title}",
                    domain="frontend",
                    description=f"Custom HTML/CSS widget implementing responsive design for '{req.title}'.",
                    hours=round(hours * 0.6, 1)
                ))
                task_id += 1
                tasks.append(DeveloperTask(
                    id=f"DEV-{task_id:03d}",
                    requirement_id=req.id,
                    title=f"Field Integration & Cross-Browser QA: {req.title}",
                    domain="qa",
                    description="Validate field persistence and mobile responsive rendering.",
                    hours=round(hours * 0.4, 1)
                ))
                task_id += 1

            else:  # custom_code
                # Full engineering lifecycle: Arch, Frontend, Backend, QA
                arch_hrs = round(hours * 0.2, 1)
                fe_hrs = round(hours * 0.35, 1)
                be_hrs = round(hours * 0.3, 1)
                qa_hrs = round(hours * 0.15, 1)

                tasks.append(DeveloperTask(
                    id=f"DEV-{task_id:03d}",
                    requirement_id=req.id,
                    title=f"Architecture & Schema Design: {req.title}",
                    domain="database",
                    description=f"API contracts, database schema, and security model for {req.title}.",
                    hours=arch_hrs
                ))
                task_id += 1
                tasks.append(DeveloperTask(
                    id=f"DEV-{task_id:03d}",
                    requirement_id=req.id,
                    title=f"Custom Frontend Interface: {req.title}",
                    domain="frontend",
                    description=f"Interactive client UI component and event bindings.",
                    hours=fe_hrs
                ))
                task_id += 1
                tasks.append(DeveloperTask(
                    id=f"DEV-{task_id:03d}",
                    requirement_id=req.id,
                    title=f"Backend API & Webhook Service: {req.title}",
                    domain="integration",
                    description=f"Server-side endpoints, external API bridges, and error-handling pipelines.",
                    hours=be_hrs
                ))
                task_id += 1
                tasks.append(DeveloperTask(
                    id=f"DEV-{task_id:03d}",
                    requirement_id=req.id,
                    title=f"Comprehensive Integration & Security QA: {req.title}",
                    domain="qa",
                    description="Unit testing, load testing, and security boundary validation.",
                    hours=qa_hrs
                ))
                task_id += 1

            total_hours += hours

        low_hours = round(total_hours * 0.85, 1)
        high_hours = round(total_hours * 1.30, 1)
        expected_hours = round(total_hours, 1)

        return tasks, low_hours, high_hours, expected_hours, round(total_savings, 2)
