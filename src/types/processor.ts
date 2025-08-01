import { Message } from "./Messages/message";

/**
 * `Processor` can processes a message before or after it is synced.
 * It can be used to modify the message, validate it, or perform any other action.
 */
export interface Processor {
    name: string;

    /**
     * Priority of the processor.
     * Lower numbers are processed first.
     */
    priority: number;

    /**
     * Process the message.
     * @param message The message to process.
     */
    //TODO: 参数 Message 可以改变，增加 Source
    process: (_message: Message) => Promise<void>;
}
