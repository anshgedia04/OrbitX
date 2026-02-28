***

title: Chat Completions Overview
description: >-
Get started with Sarvam AI LLM models for conversational AI. Build intelligent
chat applications with native Indian language support and deep contextual
reasoning capabilities.
icon: rocket
canonical-url: '[https://docs.sarvam.ai/api-reference-docs/chat-completion/overview](https://docs.sarvam.ai/api-reference-docs/chat-completion/overview)'
'og:title': Sarvam AI Chat Completion API - Indian Language LLM Models
'og:description': >-
Build intelligent conversational AI with Sarvam AI's chat completion models.
Native support for Indian languages with advanced reasoning capabilities.
'og:type': article
'og:site\_name': Sarvam AI Developer Documentation
'og:image':
type: url
value: >-
[https://res.cloudinary.com/dvcb20x9a/image/upload/v1743510800/image\_3\_rpnrug.png](https://res.cloudinary.com/dvcb20x9a/image/upload/v1743510800/image_3_rpnrug.png)
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary\_large\_image
'twitter:title': Sarvam AI Chat Completion API - Indian Language LLM Models
'twitter:description': >-
Build intelligent conversational AI with Sarvam AI's chat completion models.
Native support for Indian languages with advanced reasoning capabilities.
'twitter:image':
type: url
value: >-
[https://res.cloudinary.com/dvcb20x9a/image/upload/v1743510800/image\_3\_rpnrug.png](https://res.cloudinary.com/dvcb20x9a/image/upload/v1743510800/image_3_rpnrug.png)
'twitter:site': '@SarvamAI'
---------------------------

Sarvam AI provides powerful chat completion APIs designed to build intelligent conversational AI experiences, with native support for Indian languages and deep contextual reasoning.

<p>
  Our Chat Completion APIs currently support the following chat model:
</p>

<div>
  <Card title="Sarvam-M" icon="brain" href="/api-reference-docs/getting-started/models/sarvam-m">
    Sarvam-M is a 24B parameter, open-weights language model built for multilingual, hybrid-reasoning in a text-only format.
  </Card>
</div>

## Features

<CardGroup cols={2}>
  <Card title="Hybrid Thinking Mode" icon="brain">
    <ul>
      <li>
        Supports both "think" and "non-think" modes
      </li>

      <li>
        Think mode for complex logical reasoning
      </li>

      <li>
        Non-think mode for efficient conversations
      </li>

      <li>
        Ideal for mathematical and coding tasks
      </li>
    </ul>
  </Card>

  {" "}

  <Card title="Advanced Indic Skills" icon="language">
    <ul>
      <li>
        Post-trained on Indian languages
      </li>

      <li>
        Native English proficiency
      </li>

      <li>
        Authentic Indian cultural values
      </li>

      <li>
        Rich understanding of local context
      </li>
    </ul>
  </Card>

  {" "}

  <Card title="Superior Reasoning Capabilities" icon="code">
    <ul>
      <li>
        Outperforms similar-sized models
      </li>

      <li>
        Strong performance on coding tasks
      </li>

      <li>
        Excellent mathematical reasoning
      </li>

      <li>
        Advanced problem-solving abilities
      </li>
    </ul>
  </Card>

  <Card title="Seamless Chatting Experience" icon="language">
    <ul>
      <li>
        Full Indic script support
      </li>

      <li>
        Romanized language support
      </li>

      <li>
        Multilingual conversation handling
      </li>

      <li>
        Natural language understanding
      </li>
    </ul>
  </Card>
</CardGroup>

## Code Examples

<Tabs>
  <Tab title="Basic Chat Completion">
    <CodeGroup>
      <CodeBlock title="Python" active>
        ```python
        from sarvamai import SarvamAI

        client = SarvamAI(
            api_subscription_key="YOUR_SARVAM_API_KEY",
        )
        response = client.chat.completions(messages=[
            {"role": "user", "content": "Hey, what is the capital of India?"}
        ])
        print(response)
        ```
      </CodeBlock>

      <CodeBlock title="JavaScript">
        ```javascript
        import { SarvamAIClient } from "sarvamai";

        // Initialize the SarvamAI client with your API key
        const client = new SarvamAIClient({
          apiSubscriptionKey: "YOUR_SARVAM_API_KEY",
        });

        async function main() {
          const response = await client.chat.completions({
            messages: [
              {
                role: "user",
                content: "What is the capital of India?",
              },
            ],
          });

          // Log the assistant's reply
          console.log(response.choices[0].message.content);
        }

        main();
        ```
      </CodeBlock>

      <CodeBlock title="cURL">
        ```bash
        curl -X POST https://api.sarvam.ai/v1/chat/completions \
          -H "Authorization: Bearer $SARVAM_API_KEY" \
          -H "Content-Type: application/json" \
          -d '{
            "messages": [
              {"role": "user", "content": "What is the capital of India?"}
            ],
            "model": "sarvam-m"
          }'
        ```
      </CodeBlock>
    </CodeGroup>
  </Tab>

  <Tab title="Multi-turn Conversation">
    <CodeGroup>
      <CodeBlock title="Python" active>
        ```python
        from sarvamai import SarvamAI

        client = SarvamAI(
            api_subscription_key="YOUR_SARVAM_API_KEY",
        )

        response = client.chat.completions(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Tell me about Indian classical music."},
                {"role": "assistant", "content": "Indian classical music is one of the oldest musical traditions in the world..."},
                {"role": "user", "content": "What are the two main styles?"}
            ],
            temperature=0.7,
            reasoning_effort="high"
        )
        print(response.choices[0].message.content)
        ```
      </CodeBlock>

      <CodeBlock title="JavaScript">
        ```javascript
        import { SarvamAIClient } from "sarvamai";

        const client = new SarvamAIClient({
            apiSubscriptionKey: "YOUR_SARVAM_API_KEY"
        });

        async function main() {
            const response = await client.chat.completions({
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: "Tell me about Indian classical music." },
                    { role: "assistant", content: "Indian classical music is one of the oldest musical traditions in the world..." },
                    { role: "user", content: "What are the two main styles?" }
                ],
                temperature: 0.7,
                reasoning_effort: "high"
            });
            console.log(response.choices[0].message.content);
        }

        main();
        ```
      </CodeBlock>

      <CodeBlock title="cURL">
        ```bash
        curl -X POST https://api.sarvam.ai/v1/chat/completions \
          -H "Authorization: Bearer $SARVAM_API_KEY" \
          -H "Content-Type: application/json" \
          -d '{
            "messages": [
              {"role": "system", "content": "You are a helpful assistant."},
              {"role": "user", "content": "Tell me about Indian classical music."},
              {"role": "assistant", "content": "Indian classical music is one of the oldest musical traditions in the world..."},
              {"role": "user", "content": "What are the two main styles?"}
            ],
            "model": "sarvam-m",
            "temperature": 0.7,
            "reasoning_effort": "high"
          }'
        ```
      </CodeBlock>
    </CodeGroup>
  </Tab>

  <Tab title="Hindi (Indic Script)">
    <CodeGroup>
      <CodeBlock title="Python" active>
        ```python
        from sarvamai import SarvamAI

        client = SarvamAI(
            api_subscription_key="YOUR_SARVAM_API_KEY",
        )

        # Chat in Hindi using Devanagari script
        response = client.chat.completions(
            messages=[
                {"role": "system", "content": "आप एक सहायक हैं जो हिंदी में जवाब देता है।"},
                {"role": "user", "content": "भारत की राजधानी क्या है?"}
            ],
            temperature=0.3
        )
        print(response.choices[0].message.content)
        ```
      </CodeBlock>

      <CodeBlock title="JavaScript">
        ```javascript
        import { SarvamAIClient } from "sarvamai";

        const client = new SarvamAIClient({
            apiSubscriptionKey: "YOUR_SARVAM_API_KEY"
        });

        async function main() {
            // Chat in Hindi using Devanagari script
            const response = await client.chat.completions({
                messages: [
                    { role: "system", content: "आप एक सहायक हैं जो हिंदी में जवाब देता है।" },
                    { role: "user", content: "भारत की राजधानी क्या है?" }
                ],
                temperature: 0.3
            });
            console.log(response.choices[0].message.content);
        }

        main();
        ```
      </CodeBlock>

      <CodeBlock title="cURL">
        ```bash
        curl -X POST https://api.sarvam.ai/v1/chat/completions \
          -H "Authorization: Bearer $SARVAM_API_KEY" \
          -H "Content-Type: application/json" \
          -d '{
            "messages": [
              {"role": "system", "content": "आप एक सहायक हैं जो हिंदी में जवाब देता है।"},
              {"role": "user", "content": "भारत की राजधानी क्या है?"}
            ],
            "model": "sarvam-m",
            "temperature": 0.3
          }'
        ```
      </CodeBlock>
    </CodeGroup>
  </Tab>

  <Tab title="Wiki Grounding">
    <CodeGroup>
      <CodeBlock title="Python" active>
        ```python
        from sarvamai import SarvamAI

        client = SarvamAI(
            api_subscription_key="YOUR_SARVAM_API_KEY",
        )

        response = client.chat.completions(
            messages=[
                {"role": "user", "content": "What is the history of the Taj Mahal?"}
            ],
            temperature=0.2,
            top_p=1,
            wiki_grounding=True
        )
        print(response.choices[0].message.content)
        ```
      </CodeBlock>

      <CodeBlock title="JavaScript">
        ```javascript
        import { SarvamAIClient } from "sarvamai";

        const client = new SarvamAIClient({
            apiSubscriptionKey: "YOUR_SARVAM_API_KEY"
        });

        async function main() {
            const response = await client.chat.completions({
                messages: [
                    { role: "user", content: "What is the history of the Taj Mahal?" }
                ],
                temperature: 0.2,
                topP: 1,
                wiki_grounding: true
            });
            console.log(response.choices[0].message.content);
        }

        main();
        ```
      </CodeBlock>

      <CodeBlock title="cURL">
        ```bash
        curl -X POST https://api.sarvam.ai/v1/chat/completions \
          -H "Authorization: Bearer $SARVAM_API_KEY" \
          -H "Content-Type: application/json" \
          -d '{
            "messages": [
              {"role": "user", "content": "What is the history of the Taj Mahal?"}
            ],
            "model": "sarvam-m",
            "temperature": 0.2,
            "top_p": 1,
            "wiki_grounding": true
          }'
        ```
      </CodeBlock>
    </CodeGroup>
  </Tab>
</Tabs>

<Card title="Key Considerations">
  <ul>
    <li>
      Reasoning effort options: low, medium, high

      <ul>
        <li>
          Setting any value enables thinking mode
        </li>

        <li>
          Higher values increase reasoning depth
        </li>
      </ul>
    </li>

    <li>
      Enable wiki_grounding for factual queries
    </li>
  </ul>
</Card>

## API Response Format

### Success Response Structure

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "sarvam-m",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The capital of India is New Delhi. It has been the capital since 1931."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 25,
    "total_tokens": 40
  }
}
```

### Response Fields

| Field                                 | Type    | Description                                                      |
| ------------------------------------- | ------- | ---------------------------------------------------------------- |
| `id`                                  | string  | Unique identifier for the completion request                     |
| `object`                              | string  | Always `"chat.completion"`                                       |
| `created`                             | integer | Unix timestamp when the completion was created                   |
| `model`                               | string  | The model used for completion                                    |
| `choices[].index`                     | integer | Index of the choice in the list                                  |
| `choices[].message.role`              | string  | Always `"assistant"`                                             |
| `choices[].message.content`           | string  | The generated text response                                      |
| `choices[].message.reasoning_content` | string  | Thinking steps (only when `reasoning_effort` is set)             |
| `choices[].finish_reason`             | string  | Why generation stopped: `"stop"`, `"length"`, `"content_filter"` |
| `usage.prompt_tokens`                 | integer | Tokens in the input prompt                                       |
| `usage.completion_tokens`             | integer | Tokens in the generated response                                 |
| `usage.total_tokens`                  | integer | Total tokens used (prompt + completion)                          |

## Error Responses

All errors return a JSON object with an `error` field containing details about what went wrong.

### Error Response Structure

```json
{
  "error": {
    "message": "Human-readable error description",
    "code": "error_code_for_programmatic_handling",
    "request_id": "unique_request_identifier"
  }
}
```

### Error Codes Reference

| HTTP Status | Error Code                   | When This Happens                             | What To Do                                       |
| ----------- | ---------------------------- | --------------------------------------------- | ------------------------------------------------ |
| `400`       | `invalid_request_error`      | Missing `messages` array or malformed request | Include valid `messages` array with role/content |
| `403`       | `invalid_api_key_error`      | API key is invalid, missing, or expired       | Verify your API key in the dashboard             |
| `422`       | `unprocessable_entity_error` | Invalid model name or parameter values        | Check temperature (0-2), model name, etc.        |
| `429`       | `insufficient_quota_error`   | API quota or rate limit exceeded              | Wait for reset or upgrade your plan              |
| `500`       | `internal_server_error`      | Unexpected server error                       | Retry the request; contact support if persistent |

### Example Error Response

```json
{
  "error": {
    "message": "Invalid value for parameter 'temperature': must be between 0 and 2",
    "code": "unprocessable_entity_error",
    "request_id": "20241115_abc12345"
  }
}
```

<Accordion title="Error Handling Code Example">
  ```python
  from sarvamai import SarvamAI
  from sarvamai.core.api_error import ApiError

  client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

  try:
      response = client.chat.completions(
          messages=[
              {"role": "user", "content": "What is the capital of India?"}
          ]
      )
      print(response.choices[0].message.content)
  except ApiError as e:
      if e.status_code == 400:
          print(f"Bad request: {e.body}")
      elif e.status_code == 403:
          print("Invalid API key. Check your credentials.")
      elif e.status_code == 422:
          print(f"Invalid parameters: {e.body}")
      elif e.status_code == 429:
          print("Rate limit exceeded. Wait and retry.")
      else:
          print(f"Error {e.status_code}: {e.body}")
  ```
</Accordion>

<Note>
  Check out our detailed [API Reference](/api-reference-docs/chat/chat-completions)
  to explore Chat Completion and all available options.
</Note>