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

def get_syllabus_system_prompt() -> str:
    """
    New system prompt for generating a detailed, chapter-based syllabus.
    """
    return """You are an expert instructional designer and curriculum author. Your task is to synthesize disparate information from web search results into a complete, coherent, and deeply structured syllabus for a university-level module.
- Your output MUST be a single, raw, and perfectly valid JSON object.
- Do NOT include any explanations, markdown like ```json, or any text outside of the JSON object.
- You will structure the entire module into logical "Chapters".
- Each Chapter will be broken down into specific "Topics".
- Each Topic will be detailed with a list of 5 to 20 core "Concepts".
- Adhere strictly to the requested JSON format.
"""

def get_syllabus_user_prompt(module_name: str, context_string: str) -> str:
    """
    Generates a clear and strict prompt for creating a syllabus.
    The required JSON structure is a list of chapters, where each chapter
    contains a list with a single object of topic-to-description mappings.
    This structure is designed to be easily parsed by frontends.
    """
    return f"""You are a strict syllabus generator and expert curriculum author. You must use ONLY the CONTEXT provided below. Your output must be ONE valid JSON object and NOTHING else.

KEY GOAL:
- Generate a syllabus with a simple, flat structure: a list of chapters, where each chapter contains a single object of topic-description pairs.

MANDATORY RULES:
1.  Your entire output must be a single, raw, valid JSON object. Do not include any extra text, introductions, or markdown formatting like ```json.
2.  The JSON shape MUST be EXACTLY:
    `{{"syllabus": [ {{ "I. <Chapter Title>": [ {{ "<Topic Number> <Topic Title>": "<Topic Description>", ... }} ] }}, ... ]}}`
3.  Use double quotes (") exclusively for all keys and string values. Use ASCII characters only. Do not add trailing commas or comments.
4.  The top-level "syllabus" key must contain a list of chapter objects.
5.  Each chapter object must have a single key, which is the chapter title (e.g., "I. Introduction to AI"). The value for this key must be a list containing exactly ONE object.
6.  This single inner object holds all the topics for that chapter as key-value pairs.
7.  The key for each topic MUST be a numbered string (e.g., "1.1 What is AI?", "2.3 Data Preprocessing").
8.  The value for each topic MUST be a single, concise string explanation. It MUST NOT be an object or an array.
9.  Produce between 4 and 10 chapters. Each chapter must contain between 3 and 10 topics.
10. Do not invent sources, papers, or datasets. Use only the provided CONTEXT. If the context is insufficient, generate canonical, conservative content appropriate for the module topic.
11. If you cannot follow these rules exactly, your ONLY output must be: `{{"error":"cannot_generate_syllabus_json"}}`.

GUIDANCE:
- Chapter titles must use Roman numerals (I, II, III...).
- Topic numbering should logically follow a `Chapter.Topic` format (e.g., topics in Chapter I are 1.1, 1.2; topics in Chapter II are 2.1, 2.2, etc.).
- Topic descriptions should be neutral, educational, and concise.

CONTEXT:
---
{context_string}
---

Now, generate the single, raw JSON object for the module "{module_name}" using the CONTEXT. Follow all MANDATORY RULES exactly.
"""

def get_mindmap_user_prompt(module_name: str, syllabus_str: str) -> str:
    """
    Generates the improved, example-driven prompt for the LLM.
    """
    return f"""
You are an expert curriculum designer. Your task is to generate a JSON object containing a list of concepts for the module "{module_name}".

Produce one JSON object: {{ "concepts": [ ... ] }} and nothing else.

Each concept object in the list MUST have EXACTLY these keys:
- "name"            : string (A unique, descriptive title for the concept)
- "description"     : string (A concise, one-sentence explanation, max 120 chars)
- "dependencies"    : array of strings (Names of other concepts that are prerequisites. Follow rules below.)
- "subtopic_number" : string (The syllabus number it relates to, e.g., "1.1", "2.3")
- "date_learned"    : null (The JSON null literal)

Key Guidelines for Dependencies:
1.  **COUNT**: Each concept should have 0, 1, or at most 2 dependencies. Use an empty list `[]` for foundational concepts.
2.  **SCOPE**: A dependency MUST be from the *same chapter* or a *PREVIOUS chapter*. For example, a concept from subtopic "3.2" can depend on concepts from "3.1" or "2.4", but NOT from "4.1".
3.  **VALIDITY**: Every name in a `dependencies` list must exactly match another concept's `name` in this output.
4.  **LOGIC**: Dependencies must be logical prerequisites. Avoid creating cycles (e.g., A -> B -> A).

Here is a small example of the correct format and logic:
{{
  "concepts": [
    {{
      "name": "What is a Variable?",
      "description": "A storage location paired with an associated symbolic name.",
      "dependencies": [],
      "subtopic_number": "1.1",
      "date_learned": null
    }},
    {{
      "name": "Primitive Data Types",
      "description": "The most basic data types available, such as integers, booleans, and strings.",
      "dependencies": ["What is a Variable?"],
      "subtopic_number": "1.2",
      "date_learned": null
    }},
    {{
      "name": "Using Functions",
      "description": "A block of code which only runs when it is called to perform an action.",
      "dependencies": ["Primitive Data Types", "What is a Variable?"],
      "subtopic_number": "2.1",
      "date_learned": null
    }}
  ]
}}

Syllabus to process:
---
{syllabus_str}
---

Generate the complete JSON object now.
"""

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
