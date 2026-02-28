***

title: How to adjust the model's thinking level with `reasoning_effort`
description: controls \*\*how much effort the model puts into reasoning.
------------------------------------------------------------------------

The `reasoning_effort` parameter controls **how much effort the model puts into reasoning and planning its response**.

* Higher effort → more thoughtful, step-by-step, or structured answers
* Lower effort → faster, simpler replies

***

### Allowed values:

| **Value**  | **Behavior**                                   |
| ---------- | ---------------------------------------------- |
| `"low"`    | Quick, simple replies                          |
| `"medium"` | Balanced depth and speed (good default choice) |
| `"high"`   | More detailed reasoning and structured answers |

***

### 💡 Tips:

* Use `"low"` when you want **short, direct responses**.
* Use `"high"` for tasks like **explanations, problem solving, reasoning**.
* `"medium"` works well for most everyday interactions.

**Note:**

* Setting higher reasoning effort may **increase response time** slightly, since the model is thinking more.

First, install the SDK:

```bash
pip install -Uqq sarvamai
```

Then use the following Python code:

```python
from sarvamai import SarvamAI

# Initialize the SarvamAI client with your API key
client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

# Example 1: Using default reasoning_effort (not specified) — balanced response
response = client.chat.completions(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize the story of the Ramayana."}
    ]
    # reasoning_effort not specified → defaults internally (balanced)
)

print(response.choices[0].message.content)
```

```python
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key="YOUR_SARVAM_API_KEY")

# Example 2: Using reasoning_effort = "high" — more detailed, thoughtful response
response = client.chat.completions(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize the story of the Ramayana."}
    ],
    reasoning_effort="high"
)

# Receive assistant's reply as output
print(response.choices[0].message.content)
```