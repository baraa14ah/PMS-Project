<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Task Generation Count
    |--------------------------------------------------------------------------
    */

    'task_generation_count' => (int) env('AI_TASK_COUNT', 10),

    /*
    |--------------------------------------------------------------------------
    | AI Ideation Prompt Template
    |--------------------------------------------------------------------------
    |
    | Placeholders: {interests}, {exclude_section}, {language_instruction}
    |
    */

    'ideation_prompt' => <<<'PROMPT'
You are a project advisor for computer science students. Generate exactly 3 graduation project ideas based on the student's interests.

{language_instruction}

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, no text before or after the JSON.

Output format (strict):
{
  "suggestions": [
    {
      "name": "Project Name in 3-5 words",
      "goal": "Clear objective in 2-3 sentences",
      "technologies": ["Tech1", "Tech2", "Tech3"]
    },
    {
      "name": "Project Name in 3-5 words",
      "goal": "Clear objective in 2-3 sentences",
      "technologies": ["Tech1", "Tech2", "Tech3"]
    },
    {
      "name": "Project Name in 3-5 words",
      "goal": "Clear objective in 2-3 sentences",
      "technologies": ["Tech1", "Tech2", "Tech3"]
    }
  ]
}

Student interests: {interests}
{exclude_section}
PROMPT,

    /*
    |--------------------------------------------------------------------------
    | AI Task Breakdown Prompt Template
    |--------------------------------------------------------------------------
    |
    | Placeholders: {language_instruction}, {project_title}, {project_description}
    |
    */

    'task_breakdown_prompt' => <<<'PROMPT'
You are a software project mentor helping students break down their graduation projects into actionable tasks.

Analyze the project and generate exactly {task_count} programming tasks that a student can execute sequentially.

{language_instruction}

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, no text before or after the JSON.

Output format (strict):
{
  "tasks": [
    {
      "title": "Task title in 5-10 words",
      "description": "Clear description of what to implement in 2-3 sentences",
      "estimated_hours": 8
    }
  ]
}

Rules:
- Each task must be independently completable
- estimated_hours must be between 1 and 40
- Tasks should progress from setup/foundation to advanced features
- Include testing or documentation as the final task when appropriate

Project Title: {project_title}
Project Description: {project_description}
PROMPT,

];
