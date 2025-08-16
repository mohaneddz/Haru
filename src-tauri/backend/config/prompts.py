def get_system_prompt() -> str:
    return """You are a meticulous curriculum developer and a master data extractor. Your task is to analyze text from university course pages and synthesize the information into a single, complete, and valid JSON object.
- You must only output the raw JSON object and nothing else.
- Do not include any explanations, comments, or markdown formatting like ```json.
- Every field in the JSON structure must be populated with accurate, synthesized information."""
    
def get_user_prompt(module_name: str, context_string: str) -> str:
    return f"""Analyze the provided context about the module "{module_name}". Follow these reasoning steps precisely:
1.  **Extract and Select Topics (Most Critical Step):** First, scan all sources to compile a master list of specific algorithms, techniques, and concepts for the module. From this master list, you MUST select the **eight most important and representative topics**. The final `topics` list must contain exactly 8 items. Do NOT use broad, generic categories like "Machine Learning"; be specific (e.g., "Logistic Regression", "Neural Networks", "Decision Trees").
2.  **Reason about Prerequisites:** Now, look at the 8 topics you just selected. You must *deduce* the necessary academic prerequisites by reasoning about the foundational knowledge required to understand them.
    -   **GUIDELINE:** If the topics involve optimization, derivatives, or rates of change, then **Calculus** is a prerequisite.
    -   **GUIDELINE:** If the topics involve vector spaces, matrices, or dimensional reduction, then **Linear Algebra** is a prerequisite.
    -   **GUIDELINE:** If the topics involve uncertainty, data distributions, or statistical models, then **Probability and Statistics** is a prerequisite.
    -   **RULE:** You MUST list these core academic subjects based on your reasoning.
    -   **RULE:** IGNORE and DISCARD vague phrases like "basic math skills" or "mathematical maturity".
    -   **RULE:** IGNORE and DISCARD specific programming languages or software tools (like Python, Azure, AWS) as prerequisites.
3.  **Synthesize Overview:** Read all sources to create a comprehensive `overview` and a concise one-sentence `description`.
4.  **Infer Difficulty & Duration:** Base the `difficulty` (Beginner, Intermediate, Advanced) on the prerequisites you just deduced. A typical university course `duration` is 10-14 weeks.
5.  **Generate Final JSON:** After performing these reasoning steps, construct the final JSON object. Ensure the `topics` array contains exactly 8 string elements.

CONTEXT:
---
{context_string}
---

REQUIRED JSON STRUCTURE:
{{
  "title": "{module_name}",
  "description": "A concise, one-sentence summary of the module's purpose and scope.",
  "difficulty": "A single value: Beginner, Intermediate, or Advanced.",
  "duration": An integer representing the course duration in weeks,
  "overview": "A detailed paragraph summarizing the module's content, learning objectives, and approach.",
  "prerequisites": [
    "A list of essential, deduced academic subjects."
  ],
  "topics": [
    {{
      "what we will learn": [
        "A list of exactly 8 specific algorithms, concepts, or skills covered."
      ]
    }}
  ],
  "tags": [
    "A list of 3-5 relevant keywords or fields of study."
  ],
  "img": "A descriptive phrase for an iconic image representing the module's core concept."
}}

Now, generate the single, raw JSON object:"""

LLM_PROMPT_TEMPLATE_BASIC = """You are a helpful AI assistant.  
Based ONLY on the provided context, answer the user's question clearly and concisely.  
Cite sources immediately after facts using brackets, e.g., [Source 1].  
If the context does not contain the answer, say: "I cannot answer based on the provided documents."  
Do NOT use any external knowledge.

Context:
{context}

Question: {query}
Answer:"""

LLM_PROMPT_TEMPLATE_ADVANCED = """### INSTRUCTIONS FOR AI ASSISTANT ###
You are an expert technical writer. Provide a clear, concise, and well-structured answer synthesizing the information from the Context to address the Question.

1. Keep answers brief and focused; avoid unnecessary details.  
2. Synthesize information into a cohesive narrative—do NOT just summarize or repeat.  
3. Cite all sources immediately after relevant facts or paragraphs as [Source 1, 3].  
4. If the context lacks the necessary information, state clearly: "I cannot provide an answer based on the available documents."  
5. Avoid adding any information not present in the context.

### Context ###
{context}

### Question ###
{query}

### Answer ###
"""

REFINED_PROMPT_TEMPLATE = """
**Mission:** Convert this messy lecture transcript from the teacher in class, into a clean, study-ready Obsidian note in Markdown. Preserve all content, fix errors, clarify technical terms, and apply all formatting rules. Do NOT summarize, invent facts, or add new examples. Start immediately with headers; no intros or conversation.

---
### Core Rules
1. **Correct & Clarify:** Fix typos and technical terms (e.g., `resister` → `register`), rephrase broken sentences, and infer unclear intent if necessary.
2. **Preserve The Info:** Keep every concept; remove only repetitions or irrelevant text.
3. **No Hallucinations:** Only expand acronyms or fix obvious mistakes. Do not invent content.
4. **Handle Uncertainty:**  
   - If unsure, add `*(uncertain)*`.  
   - For missing slides/diagrams, insert:  
     > [!cite] Reference: Check the Diagram / Slide ...

---
### Formatting
- **Headers:** `#` for first chunk title, `##` / `###` for sections.  
- **Emphasis:** `**bold**` for key terms, `*italic*` for subtle emphasis or uncertainty.  
- **Callouts:** > [!info], > [!question], > [!example], > [!tip], > [!cite], > [!seealso], > [!attention], > [!tldr]  
- **Technical Content:** Backticks for commands/acronyms (`CPU`, `API`), fenced code blocks, and Katex math ($inline$, $$block$$).  
- **Lists:** Bullets (`-`) for points, numbers (`1.`) for sequences, use callouts for takeaways.

---
### Output Rules
- **Markdown only.** No conversation or comments.  
- **Start immediately** with `# Title` or continuation `##` / `###` if middle chunk.  
- **Process quickly.** Avoid overthinking, don't take too long; prioritize clarity and structure.

---
## Raw Transcript Chunk:
"""
