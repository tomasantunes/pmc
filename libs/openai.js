const OpenAI = require("openai");

function getOpenAIInstance() {
    const configuration = {
    apiKey: secretConfig.OPENAI_API_KEY,
    };

    const openai = new OpenAI(configuration);
    return openai;
}

async function getMotivationalText(openai, messages) {
  var task_list = await getTaskList();
  var prompt = "Generate a motivational text to help me do my tasks and get productive based on the following task list: ";
  prompt += task_list.join(", ");
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{"role": "user", "content": prompt}],
  });
  console.log(completion.choices[0].message);
  var message = completion.choices[0].message;
  return message.content;
}


module.exports = {
    getOpenAIInstance,
    getMotivationalText,
    default: {
        getOpenAIInstance,
        getMotivationalText
    }
};