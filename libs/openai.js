const OpenAI = require("openai");
const {getTaskList} = require('./tasks');
const secretConfig = require('../secret-config');
const path = require('path');
const fs = require('fs');

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

async function tts(openai, text) {
  const filepath = crypto.getRandomBytes(16).toString("hex") + ".mp3";
  const speechFile = path.resolve("./speech/" + filepath);
  const mp3 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "coral",
    input: text,
    instructions: "Speak in a cheerful and positive tone.",
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
  return filepath;
}


module.exports = {
    getOpenAIInstance,
    getMotivationalText,
    tts,
    default: {
        getOpenAIInstance,
        getMotivationalText,
        tts
    }
};