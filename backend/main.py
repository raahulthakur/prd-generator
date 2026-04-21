from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import anthropic
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PRD Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic").lower()
LLM_MODEL = os.getenv("LLM_MODEL", "")

if LLM_PROVIDER == "openrouter":
    openrouter_client = openai.OpenAI(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )
    DEFAULT_MODEL = LLM_MODEL or "openai/gpt-4o-mini"
else:
    anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    DEFAULT_MODEL = LLM_MODEL or "claude-opus-4-6"

PRD_SYSTEM_PROMPT = """You are an expert product manager who writes concise, structured Product Requirements Documents (PRDs).

When given a problem statement, produce a clean one-pager PRD in Markdown with exactly these sections:

# [Product/Feature Name]

## Overview
One or two sentences capturing the essence of what is being built and why.

## Problem Statement
A clear articulation of the pain point, who experiences it, and its business impact.

## Goals
Bullet list of 3–5 measurable objectives this product/feature must achieve.

## Target Users
Brief description of the primary and secondary users (personas, not demographics).

## Key Features
Numbered list of the core capabilities, written as user-facing outcomes.

## Out of Scope
Bullet list of what is explicitly NOT included in this version.

## Success Metrics
Bullet list of 3–4 KPIs or measurable outcomes that define success.

## Open Questions
Bullet list of 2–4 key unknowns or decisions that still need resolution.

---
*Estimated Effort: [S / M / L / XL]*  |  *Priority: [P0 / P1 / P2]*

Rules:
- Keep the entire document under 500 words.
- Be specific and concrete. Avoid vague language like "improve" or "enhance".
- Write in plain English. No jargon unless it is standard in the domain.
- Do NOT add any preamble or explanation outside the PRD itself.
"""


class PRDRequest(BaseModel):
    problem_statement: str

    @field_validator("problem_statement")
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("problem_statement must not be empty")
        if len(v) > 4000:
            raise ValueError("problem_statement must be under 4000 characters")
        return v


class PRDResponse(BaseModel):
    prd: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "provider": LLM_PROVIDER, "model": DEFAULT_MODEL}


@app.post("/generate-prd", response_model=PRDResponse)
def generate_prd(req: PRDRequest) -> PRDResponse:
    try:
        if LLM_PROVIDER == "openrouter":
            response = openrouter_client.chat.completions.create(
                model=DEFAULT_MODEL,
                max_tokens=1024,
                messages=[
                    {"role": "system", "content": PRD_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Problem statement:\n\n{req.problem_statement}",
                    },
                ],
            )
            prd_text = response.choices[0].message.content
        else:
            message = anthropic_client.messages.create(
                model=DEFAULT_MODEL,
                max_tokens=1024,
                system=PRD_SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": f"Problem statement:\n\n{req.problem_statement}",
                    }
                ],
            )
            prd_text = message.content[0].text

        return PRDResponse(prd=prd_text)
    except openai.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid OpenRouter API key.")
    except openai.RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit reached. Please try again shortly.")
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit reached. Please try again shortly.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
