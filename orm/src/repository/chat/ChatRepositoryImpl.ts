import {
    AbstractChatRepository,
    Account,
    ChatMessage,
    ChatRepository,
    ChatUser,
    PendingChatMessage,
} from "amerykahospital-personalizedadvice-businesslogic";
import * as _ from "lodash";
import uuid from "uuid/v4";

import { RealtimeDBKeys } from "../../config/RealtimeDBKeys";
import { RealtimeDbEquivalent } from "../../types/RealtimeDbEquivalent";

export class ChatRepositoryImpl extends AbstractChatRepository implements ChatRepository {
    private realtimeDb: RealtimeDbEquivalent;

    public constructor(realtimeDb: RealtimeDbEquivalent) {
        super();
        this.realtimeDb = realtimeDb;
    }

    public async listToChannel(channel: string): Promise<ChatMessage[]> {
        const snapshot = await this.messagesRefByTimestamp(this.channelSelector(channel)).once("value");
        return this.snapshotToArray<ChatMessage>(snapshot, ChatMessage.isValid).sort(
            (a, b) => b.timestampMs - a.timestampMs,
        );
    }

    public async listToUid(uid: string): Promise<ChatMessage[]> {
        const snapshot = await this.messagesRefByTimestamp(this.uidSelector(uid)).once("value");
        return this.snapshotToArray<ChatMessage>(snapshot, ChatMessage.isValid).sort(
            (a, b) => b.timestampMs - a.timestampMs,
        );
    }

    public async listUsersWithRole(role: ChatUser.Role.Type): Promise<ChatUser[]> {
        const snapshot = await this.usersRef()
            .orderByChild(ChatUser.keys.role!)
            .equalTo(role)
            .once("value");
        return this.snapshotToArray<ChatUser>(snapshot, ChatUser.isValid).sort(
            (a, b) => b.lastSeenTimestampMs - a.lastSeenTimestampMs,
        );
    }

    public listenForMessagesToChannel(
        channel: string,
        callback: ChatRepository.MessageCallback,
    ): { cancel: ChatRepository.CancelListeningFn } {
        const ref = this.messagesRef(this.channelSelector(channel));
        return this.listenToMessagesInRef(ref, callback);
    }

    public listenForMessagesToUid(
        uid: string,
        callback: ChatRepository.MessageCallback,
    ): { cancel: ChatRepository.CancelListeningFn } {
        const ref = this.messagesRef(this.uidSelector(uid));
        return this.listenToMessagesInRef(ref, callback);
    }

    public async setUserRole(account: Account, role: ChatUser.Role.Type): Promise<void> {
        Account.validate(account);
        await this.writeChatUser({
            id: account.uid,
            uid: account.uid,
            displayName: `user-${account.uid}`,
            lastSeenTimestampMs: this.getTimestampMs(),
            role,
        });
    }

    protected async writeChatUser(user: ChatUser): Promise<ChatUser> {
        ChatUser.validate(user);
        await this.usersRef()
            .child(user.id)
            .set(user);

        return user;
    }

    protected async writeMessage(pendingMsg: PendingChatMessage): Promise<ChatMessage> {
        PendingChatMessage.validate(pendingMsg);
        const msg: ChatMessage = {
            id: uuid(),
            timestampMs: this.getTimestampMs(),
            ...pendingMsg,
        };
        ChatMessage.validate(msg);

        const selector = pendingMsg.toChannel
            ? this.channelSelector(pendingMsg.toChannel)
            : pendingMsg.toUid
            ? this.uidSelector(pendingMsg.toUid)
            : "";
        const messagesRef = this.messagesRef(selector);
        const child = messagesRef.child(msg.id);
        await child.set(msg);
        return msg;
    }

    protected getTimestampMs(): number {
        return Date.now();
    }

    private listenToMessagesInRef(
        ref: RealtimeDbEquivalent.Reference,
        callback: ChatRepository.MessageCallback,
    ): { cancel: ChatRepository.CancelListeningFn } {
        const realtimeCb = (ds: RealtimeDbEquivalent.DataSnapshot) => {
            const val = ds.val();
            if (ChatMessage.isValid(val)) {
                callback(val);
            }
        };
        ref.on("child_added", realtimeCb);
        return {
            cancel: () => ref.off("child_added", realtimeCb),
        };
    }

    private snapshotToArray<T>(snapshot: RealtimeDbEquivalent.DataSnapshot, typeguardFn: (v: any) => v is T) {
        if (!snapshot.exists) return [];
        const val = snapshot.val();
        if (val === null) return [];

        const msgs = _.values(val);
        const msgsFiltered = msgs.filter(elem => typeguardFn(elem)) as T[];
        return msgsFiltered;
    }

    private channelSelector(channel: string) {
        return `chan_${channel}`;
    }

    private uidSelector(uid: string) {
        return `uid_${uid}`;
    }

    private messagesRefByTimestamp(childListSelector: string) {
        return this.messagesRef(childListSelector)
            .limitToLast(ChatRepositoryImpl.SHOW_LAST_NUM_OF_MSGS)
            .orderByChild(ChatMessage.keys.timestampMs);
    }

    private messagesRef(childListSelector: string) {
        return this.realtimeDb.ref(RealtimeDBKeys.CHAT_MESSAGES).child(childListSelector);
    }

    private usersRef() {
        return this.realtimeDb.ref(RealtimeDBKeys.CHAT_USERS);
    }
}

export namespace ChatRepositoryImpl {
    export const SHOW_LAST_NUM_OF_MSGS = 200;
}
