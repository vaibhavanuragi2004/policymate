Multilingual Policy Advisor for Global Enterprises
A web application enabling users from different regions and departments to ask questions or upload documents related to corporate policies (e.g., compliance, HR, data privacy) and receive accurate, context-aware answers in their native language.

🚀 Project Overview
This app allows users to interact naturally with enterprise policy documents in multiple languages. It employs a Retrieval-Augmented Generation (RAG) pipeline, combining vector search over internal documents with large language model reasoning to provide precise answers.

Key Functionalities
Multilingual Support:
Users select their native language to ask questions about policies, with answers generated in the same language.

Retrieval-Augmented Generation Workflow:

User input is translated if necessary.

LangChain queries FAISS vector store of policy documents for relevant context.

The Qwen3 model generates an answer using retrieved policy snippets.

The answer is translated back to the user’s language.

User-Focused Access:
Simplified access without role-based differentiation— all users receive consistent, high-quality policy answers.
