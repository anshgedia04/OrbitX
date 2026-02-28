***

title: How to control the response length with `max_tokens`
description: control how long the model's response can be
---------------------------------------------------------

The `max_tokens` parameter lets you control **how long the model's response can be** — in terms of tokens.

* A **token** can be a word, part of a word, or even punctuation\
  (Example: "Hello!" = 2 tokens: `"Hello"` + `"!"`)

### Why use `max_tokens`?

* To **limit the size** of the output
* To **control latency / cost** (fewer tokens = faster and cheaper)
* To avoid overly long answers if you want concise responses

***

### How to choose the value:

### Parameter details:

| Parameter | Type    | Default |
| --------- | ------- | ------- |
| `n`       | Integer | 2048    |

***

First, install the SDK:

```bash
pip install -Uqq sarvamai
```

Then use the following Python code:

```python
from sarvamai import SarvamAI

# Initialize the SarvamAI client with your API key
client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

# Example 1: Using default max_tokens (not specified) — model decides length
response = client.chat.completions(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Tell me about the planet Mars."}
    ]
    # max_tokens not specified → model uses internal maximum
)

print(response.choices[0].message.content)
```

```python
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

# Example 2: Using max_tokens = 100 — limit response length
response = client.chat.completions(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize the plot of Mahabharata."}
    ],
    max_tokens=100
)

# Receive assistant's reply as output
print(response.choices[0].message.content)
```