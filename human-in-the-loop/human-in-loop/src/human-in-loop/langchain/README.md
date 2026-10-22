


[
  {
    "id": "8f7d19749587b0be943010caef473248",
    "value": {
      "actionRequests": [
        {
          "name": "write_file",
          "args": {
            "filename": "ben-project.py",
            "content": "#!/usr/bin/env p"
          },
          "description": "🚨 File Creation requires human approval"
        }
      ],
      "reviewConfigs": [
        {
          "actionName": "write_file",
          "allowedDecisions": [
            "approve",
            "reject"
          ]
        }
      ]
    }
  }
]

Interrupt decision types
The middleware defines three built-in ways a human can respond to an interrupt:
Decision Type	Description	Example Use Case

1. ✅ approve	The action is approved as-is and executed without changes.	
     Send an email draft exactly as written
2. ✏️ edit	The tool call is executed with modifications.	
       Change the recipient before sending an email
3. ❌ reject	The tool call is rejected, with an explanation added to the conversation.
 	Reject an email draft and explain how to rewrite it
