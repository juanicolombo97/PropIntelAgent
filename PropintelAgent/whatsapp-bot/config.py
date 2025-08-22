import os

# Tablas DynamoDB
LEADS_TABLE = os.getenv("LEADS_TABLE", "Leads")
MESSAGES_TABLE = os.getenv("MESSAGES_TABLE", "Messages")
PROPERTIES_TABLE = os.getenv("PROPERTIES_TABLE", "Properties")
VISITS_TABLE = os.getenv("VISITS_TABLE", "Visits")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") 
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
