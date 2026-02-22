import { basicFnCalling } from "./basic-eg-fn-calling"; // this is the basic example of function calling 
async function main() {

    try {
        await basicFnCalling()
    } catch (error) {
        console.log(error);

    }
}


main()