import { basicFnCalling } from "./basic-eg-fn-calling"; // this is the basic example of function calling 
import { Call_LLM } from "./chat_pdf";
import 'dotenv/config'
async function main() {

    try {
        // await basicFnCalling()
        await Call_LLM()
    } catch (error) {
        console.log(error);

    }
}


main()