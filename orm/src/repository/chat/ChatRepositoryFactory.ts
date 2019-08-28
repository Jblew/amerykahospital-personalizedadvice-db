import { ChatRepository } from "amerykahospital-personalizedadvice-businesslogic";

import { RealtimeDbEquivalent } from "../../types/RealtimeDbEquivalent";

import { ChatRepositoryImpl } from "./ChatRepositoryImpl";

export namespace ChatRepositoryFactory {
    export function make(realtimeDb: RealtimeDbEquivalent): ChatRepository {
        return new ChatRepositoryImpl(realtimeDb);
    }
}
