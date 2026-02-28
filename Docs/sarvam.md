***

title: Sarvam-M
description: >-
Sarvam-M - 24B parameter multilingual, hybrid-reasoning language model with
20% improvement on Indian language benchmarks and Wikipedia grounding support.
canonical-url: '[https://docs.sarvam.ai/api-reference-docs/models/sarvam-m](https://docs.sarvam.ai/api-reference-docs/models/sarvam-m)'
'og:title': Sarvam-M Chat Model - 24B Parameter Indian Language LLM by Sarvam AI
'og:description': >-
Sarvam-M 24B parameter multilingual chat model built on Mistral-Small. 20%
improvement on Indian language benchmarks with hybrid reasoning and Wikipedia
grounding.
'og:type': article
'og:site\_name': Sarvam AI Developer Documentation
'og:image':
type: url
value: >-
[https://res.cloudinary.com/dvcb20x9a/image/upload/v1743510800/image\_3\_rpnrug.png](https://res.cloudinary.com/dvcb20x9a/image/upload/v1743510800/image_3_rpnrug.png)
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary\_large\_image
'twitter:title': Sarvam-M Chat Model - 24B Parameter Indian Language LLM by Sarvam AI
'twitter:description': >-
Sarvam-M 24B parameter multilingual chat model built on Mistral-Small. 20%
improvement on Indian language benchmarks with hybrid reasoning and Wikipedia
grounding.
'twitter:image':
type: url
value: >-
[https://res.cloudinary.com/dvcb20x9a/image/upload/v1743510800/image\_3\_rpnrug.png](https://res.cloudinary.com/dvcb20x9a/image/upload/v1743510800/image_3_rpnrug.png)
'twitter:site': '@SarvamAI'
---------------------------

**Sarvam-M (Reasoning LLM)**

Multilingual, hybrid-reasoning, text-only model built on Mistral-Small.

Post-trained for superior reasoning and Indic language support.

**Performance Improvements:**

* **+20%** on Indian language benchmarks
* **+21.6%** on math benchmarks
* **+17.6%** on programming benchmarks
* **+86%** on romanized Indian language GSM-8K benchmarks

**Key Features:**

* **Hybrid Thinking Mode:** Switch between "think" (reasoning, coding, math) and "non-think" (fast conversations).
* **Advanced Indic Skills:** Authentically trained on Indian languages & cultural contexts.
* **Superior Reasoning:** Outperforms similar-sized models on coding & math.
* **Seamless Chat:** Works across Indic scripts & romanized text.

## Key Features

<CardGroup cols={2}>
  <Card title="Strong Indian Language Support" icon="globe">
    Trained in 11 major Indic languages with support for native script, Romanised, and code-mixed inputs, tailored for everyday and formal Indian use cases.
  </Card>

  <Card title="Hybrid Reasoning Model" icon="lightbulb">
    Supports both "think" and "non-think" modes, excelling in math, logic, and code-related tasks with special training for improved reasoning and direct answers.
  </Card>

  <Card title="Efficient and Fast Inference" icon="zap">
    Uses compression to make responses faster, works well even on lower-cost hardware setups, and can handle many users at once without slowing down.
  </Card>

  <Card title="Knowledge Augmentation with Wikipedia" icon="book">
    Looks up facts from Wikipedia when needed, gives more accurate answers for current or detailed topics, and works across English and Indian languages.
  </Card>

  <Card title="Superior Performance" icon="chart-line">
    Outperforms leading models including Mistral 3 Small, Gemma 3, and Llama models across Indian language benchmarks.
  </Card>

  <Card title="Context-Aware Processing" icon="brain">
    Maintains context across long conversations with 8192 token context length and intelligent reasoning capabilities.
  </Card>
</CardGroup>

## Performance Benchmarks

### Indic Vibe Check Benchmark

| Language    | Sarvam M (24B) | Mistral 3 Small (24B) | Gemma 3 (27B) | Llama 4 Scout (17B/109B) | Llama 3 (70B) |
| ----------- | -------------- | --------------------- | ------------- | ------------------------ | ------------- |
| Bengali     | **8.17**       | 7.62                  | 7.29          | 7.59                     | 7.01          |
| English     | **8.35**       | 8.32                  | 7.85          | 8.17                     | 8.20          |
| Gujarati    | **8.21**       | 7.53                  | 7.52          | 7.67                     | 6.74          |
| Hindi       | **8.30**       | 8.10                  | 7.82          | 7.69                     | 7.53          |
| Kannada     | **7.98**       | 7.53                  | 7.53          | 7.68                     | 6.59          |
| Malayalam   | **8.19**       | 7.50                  | 7.46          | 7.68                     | 6.96          |
| Marathi     | **8.17**       | 7.38                  | 7.48          | 7.97                     | 7.12          |
| Oriya       | **7.82**       | 3.43                  | 6.52          | 6.46                     | 5.68          |
| Punjabi     | **8.15**       | 7.49                  | 7.48          | 7.63                     | 6.96          |
| Tamil       | **7.92**       | 7.40                  | 7.55          | 7.30                     | 6.56          |
| Telugu      | **8.05**       | 7.39                  | 6.95          | 7.52                     | 6.87          |
| **Average** | **8.12**       | 7.24                  | 7.40          | 7.58                     | 6.93          |

## Model Specifications

<Card title="Key Considerations">
  <ul>
    <li>
      Maximum context length: 8192 tokens
    </li>

    <li>
      Temperature range: 0 to 2

      <ul>
        <li>
          Non-thinking mode: 0.2 (recommended)
        </li>

        <li>
          Thinking mode: 0.5 (recommended)
        </li>
      </ul>
    </li>

    <li>
      Top-p range: 0 to 1
    </li>

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

## Key Capabilities

<Tabs>
  <Tab title="Basic Chat Completion">
    <div>
      Simple, one-turn interaction where the user asks a question and the model replies with a single, direct response.
    </div>

    <CodeGroup>
      <CodeBlock title="Python" active>
        ```python
        from sarvamai import SarvamAI

        client = SarvamAI(
            api_subscription_key="YOUR_SARVAM_API_KEY",
        )

        response = client.chat.completions(
            messages=[
                {"role": "user", "content": "Why is India called a land of diverse landscapes?"}
            ],
            temperature=0.5,
            top_p=1,
            max_tokens=1000,
        )

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
                        content: "Why is India called a land of diverse landscapes?",
                    },
                ],
                temperature: 0.5,
                top_p: 1,
                max_tokens: 1000,
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
              {"role": "user", "content": "Why is India called a land of diverse landscapes?"}
            ],
            "model": "sarvam-m",
            "temperature": 0.5,
            "top_p": 1,           
            "max_tokens": 1000
          }'
        ```
      </CodeBlock>
    </CodeGroup>
  </Tab>

  <Tab title="Multi-turn Conversation">
    <div>
      Involves multiple exchanges between the system, user, and assistant, where context is maintained across all turns for coherent and relevant responses.
    </div>

    <CodeGroup>
      <CodeBlock title="Python" active>
        ```python
        from sarvamai import SarvamAI

        client = SarvamAI(
            api_subscription_key="YOUR_SARVAM_API_KEY",
        )

        response = client.chat.completions(
            messages=[
                {"role": "system", "content": "You are a travel expert specializing in Indian destinations."},
                {"role": "user", "content": "Suggest a good place to visit in South India."},
                {"role": "assistant", "content": "You can visit Munnar in Kerala. It's known for its tea plantations and cool climate."},
                {"role": "user", "content": "What is the best time to visit Munnar?"}
            ],
            temperature=0.7,
            top_p=1,
            max_tokens=1000
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
                    { role: "system", content: "You are a travel expert specializing in Indian destinations." },
                    { role: "user", content: "Suggest a good place to visit in South India." },
                    { role: "assistant", content: "You can visit Munnar in Kerala. It's known for its tea plantations and cool climate." },
                    { role: "user", content: "What is the best time to visit Munnar?" }
                ],
                temperature: 0.7,
                top_p: 1,
                max_tokens: 1000
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
              {"role": "system", "content": "You are a travel expert specializing in Indian destinations."},
              {"role": "user", "content": "Suggest a good place to visit in South India."},
              {"role": "assistant", "content": "You can visit Munnar in Kerala. It is known for its tea plantations and cool climate."},
              {"role": "user", "content": "What is the best time to visit Munnar?"}
            ],
            "model": "sarvam-m",
            "temperature": 0.7,
            "top_p": 1,           
            "max_tokens": 1000
          }'
        ```
      </CodeBlock>
    </CodeGroup>
  </Tab>

  <Tab title="Wiki Grounding">
    <div>
      Wiki grounding allows the Sarvam-M model to fetch and use information from Wikipedia to give more accurate and fact-based answers.
    </div>

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

## Next Steps

<CardGroup cols={3}>
  <Card title="Developer quickstart" icon="sparkles" href="/api-reference-docs/api-guides-tutorials/chat-completion">
    Learn how to integrate chat completion into your application.
  </Card>

  <Card title="API Reference" icon="terminal" href="/api-reference-docs/chat/chat-completions">
    Complete API documentation for chat completion endpoints.
  </Card>

  <Card title="Cookbook" icon="book" href="/api-reference-docs/api-guides-tutorials/chat-completion/overview">
    Step-by-step tutorial for chat completion implementation.
  </Card>
</CardGroup>
