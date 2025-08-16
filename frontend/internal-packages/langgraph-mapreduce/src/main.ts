import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, END, START, Annotation, Send } from "@langchain/langgraph";

/* Model and prompts */

// Define model and prompts we will use
const subjectsPrompt = "Generate a comma separated list of between 2 and 5 examples related to: {topic}."
const jokePrompt = "Generate a joke about {subject}"
const bestJokePrompt = `Below are a bunch of jokes about {topic}. Select the best one! Return the ID (index) of the best one.

{jokes}`

// Zod schemas for getting structured output from the LLM
const Subjects = z.object({
  subjects: z.array(z.string()),
});
const Joke = z.object({
  joke: z.string(),
});
const BestJoke = z.object({
  id: z.number(),
});

const model = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
});

/* Graph components: define the components that will make up the graph */

// This will be the overall state of the main graph.
// It will contain a topic (which we expect the user to provide)
// and then will generate a list of subjects, and then a joke for
// each subject
const OverallState = Annotation.Root({
  topic: Annotation<string>,
  subjects: Annotation<string[]>,
  // Notice here we pass a reducer function.
  // This is because we want combine all the jokes we generate
  // from individual nodes back into one list.
  jokes: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
  }),
  bestSelectedJoke: Annotation<string>,
});

// This will be the state of the node that we will "map" all
// subjects to in order to generate a joke
interface JokeState {
  subject: string;
}

// This is the function we will use to generate the subjects of the jokes
const generateTopics = async (
  state: typeof OverallState.State
): Promise<Partial<typeof OverallState.State>> => {
  const prompt = subjectsPrompt.replace("topic", state.topic);
  const response = await model
    .withStructuredOutput(Subjects, { name: "subjects" })
    .invoke(prompt);
  return { subjects: response.subjects };
};

// Function to generate a joke
const generateJoke = async (state: JokeState): Promise<{ jokes: string[] }> => {
  const prompt = jokePrompt.replace("subject", state.subject);
  const response = await model
    .withStructuredOutput(Joke, { name: "joke" })
    .invoke(prompt);
  return { jokes: [response.joke] };
};

// Here we define the logic to map out over the generated subjects
// We will use this an edge in the graph
const continueToJokes = (state: typeof OverallState.State) => {
  // We will return a list of `Send` objects
  // Each `Send` object consists of the name of a node in the graph
  // as well as the state to send to that node
  return state.subjects.map((subject) => new Send("generateJoke", { subject }));
};

// Here we will judge the best joke
const bestJoke = async (
  state: typeof OverallState.State
): Promise<Partial<typeof OverallState.State>> => {
  const jokes = state.jokes.join("\n\n");
  const prompt = bestJokePrompt
    .replace("jokes", jokes)
    .replace("topic", state.topic);
  const response = await model
    .withStructuredOutput(BestJoke, { name: "best_joke" })
    .invoke(prompt);
  return { bestSelectedJoke: state.jokes[response.id] };
};

// Construct the graph: here we put everything together to construct our graph
const graph = new StateGraph(OverallState)
  .addNode("generateTopics", generateTopics)
  .addNode("generateJoke", generateJoke)
  .addNode("bestJoke", bestJoke)
  .addEdge(START, "generateTopics")
  .addConditionalEdges("generateTopics", continueToJokes)
  .addEdge("generateJoke", "bestJoke")
  .addEdge("bestJoke", END);

const app = graph.compile();

// Main execution
const main = async () => {
  const topic = process.argv[2] || "animals";
  
  console.log(`Generating jokes about: ${topic}\n`);
  
  try {
    const result = await app.invoke({ topic });
    
    console.log("Generated subjects:", result.subjects);
    console.log("\nAll jokes:");
    result.jokes.forEach((joke, index) => {
      console.log(`${index + 1}. ${joke}`);
    });
    console.log("\n🏆 Best joke:", result.bestSelectedJoke);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

// Execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}