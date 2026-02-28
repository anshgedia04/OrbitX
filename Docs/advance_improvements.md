***

title: How to list your chat messages
description: Defines your entire conversation.
----------------------------------------------

The `messages` parameter defines your entire conversation so far — this is how you "teach" the model what has happened in the chat.

Each message is an object with two fields:

| **Key**   | **Value**                              |
| --------- | -------------------------------------- |
| `role`    | `"system"`, `"user"`, or `"assistant"` |
| `content` | The message text (string)              |

### Why is this important?

* The model uses the conversation history to generate **context-aware replies**.
* The order of the messages matters — the model reads them **top to bottom**.
* Including previous assistant responses helps the model maintain **coherence** and **memory**.

### Roles explained:

* **`system`**  (Optional, but Recommended)\
  Sets initial behavior, tone, or instructions for the assistant.\
  *Example:* `"You are a helpful assistant."`

* **`user`**  (Required)\
  Represents questions, requests, or inputs from the user.\
  *Example:* `"Tell me about Indian classical music."`

* **`assistant`**  (Optional, only for context in multi-turn)\
  Contains previous replies from the model, which help it stay consistent in tone and content.\
  *Example:* `"Indian classical music is one of the oldest musical traditions..."`

### Example: Listing messages in a conversation

First, install the SDK:

```bash
pip install -Uqq sarvamai
```

Then use the following Python code:

```python
from sarvamai import SarvamAI

# Initialize the SarvamAI client with your API key
client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

# Example 1: Default example - single "user" message which is required (no prior context)
response = client.chat.completions(
    messages=[
        {"role": "user", "content": "Hey, what is the capital of India?"}
    ]
)

print(response.choices[0].message.content)
```

```python
# Example 2: Multi-turn example — maintaining conversation context
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

response = client.chat.completions(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Tell me about Indian classical music."},
        {"role": "assistant", "content": "Indian classical music is one of the oldest musical traditions in the world, with roots in ancient texts like the Natya Shastra."},
        {"role": "user", "content": "What are the two main styles?"}
    ]
)

# Receive assistant's reply as output
print(response.choices[0].message.content)
```


***

title: How to control response randomness with `temperature`
description: Controls how random or deterministic the model's responses will be.
--------------------------------------------------------------------------------

The `temperature` parameter controls **how random or deterministic** the model's responses will be.

**Range:** `0` to `2`\
**Default:** `0.2`

* **Lower temperature** → more focused, predictable answers (e.g. `0.2`)
* **Higher temperature** → more creative, varied responses (e.g. `0.8` or `1.0`)

👉 **Tip**: For most use cases, values between `0.2` and `0.8` give good results.

### How it works:

| **Mode**              | **Recommended `temperature`** | **Behavior**                        |
| --------------------- | ----------------------------- | ----------------------------------- |
| Non-thinking mode     | `0.2` *(default)*             | Straightforward, factual responses  |
| Thinking mode         | `0.5` or higher               | Deeper reasoning, more exploration  |
| Highly creative       | `0.8` - `1.0`                 | Storytelling, brainstorming, poetry |
| Very random / playful | `> 1.0`                       | Unexpected, experimental output     |

First, install the SDK:

```bash
pip install -Uqq sarvamai
```

Then use the following Python code:

```python
from sarvamai import SarvamAI

# Initialize the SarvamAI client with your API key
client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

# Example 1: Using default temperature (0.2) — straightforward, factual response
response = client.chat.completions(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain the concept of gravity."}
    ]
    # temperature is not specified → uses default 0.2
)

print(response.choices[0].message.content)
```

```python
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

# Example 2: Using temperature = 0.9 — more creative, varied response
response = client.chat.completions(
    messages=[
        {"role": "system", "content": "You are a creative storyteller."},
        {"role": "user", "content": "Tell me a story about a magical tiger."}
    ],
    temperature=0.9  # More creative storytelling
)

# Receive assistant's reply as output
print(response.choices[0].message.content)
```