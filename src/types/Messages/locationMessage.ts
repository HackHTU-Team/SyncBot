import { Message } from "./message";

export interface LocationMessage extends Message {
    type: 'location';
    content: {
        latitude: number;
        longitude: number;
    };
    address?: string;
    accuracy?: number;
}
