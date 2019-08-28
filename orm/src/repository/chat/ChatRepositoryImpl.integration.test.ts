import {
    Account,
    ChatMessage,
    ChatRepository,
    ChatUser,
    PendingChatMessage,
} from "amerykahospital-personalizedadvice-businesslogic";

import { IntegrationTestsEnvironment } from "../../_test/IntegrationTestsEnvironment";
import { _, BluebirdPromise, expect, sinon, uuid } from "../../_test/test_environment";
import { RealtimeDBKeys } from "../../config/RealtimeDbKeys";

import { ChatRepositoryFactory } from "./ChatRepositoryFactory";
import { ChatRepositoryImpl } from "./ChatRepositoryImpl";

describe.only("ChatRepositoryImpl", function() {
    const env = new IntegrationTestsEnvironment();
    let repository: ChatRepository;
    beforeEach(async () => await env.prepareEach());
    beforeEach(() => {
        repository = ChatRepositoryFactory.make(env.database);
    });
    afterEach(async () => await env.cleanupEach());

    function sampleAccount(): Account {
        return {
            uid: `uid-${uuid()}`,
            displayName: `displayName-${uuid()}`,
        };
    }

    function sampleMessage(p: { toChannel?: string; toUid?: string }): PendingChatMessage {
        return {
            fromUid: `fromuuid-${uuid()}`,
            fromName: `fromname-${uuid()}`,
            ...p,
            message: `msg-${uuid()}`,
        };
    }

    describe("addMessage", function() {
        this.timeout(6000);

        let account: Account;
        let msg: PendingChatMessage;
        let channel: string;

        beforeEach(() => {
            channel = `chan-${uuid()}`;
            account = sampleAccount();
            msg = sampleMessage({ toChannel: channel });
        });

        it("Adds message", async () => {
            await repository.addMessage(account, msg);
            const gotMsgs = await repository.listToChannel(channel);
            expect(gotMsgs[0]).to.include(msg);
        });

        it("Sets timestamp", async () => {
            await repository.addMessage(account, msg);
            const gotMsgs = await repository.listToChannel(channel);
            expect(gotMsgs[0].timestampMs).to.be.approximately(Date.now(), 6000);
        });

        it("Adds new user if didn't existed before", async () => {
            const childAdded = sinon.spy();
            env.database.ref(RealtimeDBKeys.CHAT_USERS).on("child_added", ds => {
                childAdded(ds.val());
            });

            await repository.addMessage(account, msg);

            expect(childAdded.callCount).to.be.equal(1);
            const createdUser: ChatUser = childAdded.firstCall.args[0];
            expect(createdUser.lastSeenTimestampMs).to.be.approximately(Date.now(), 6000);
            expect(createdUser.displayName).to.be.equal(account.displayName);
        });

        it("Updates user's last seen if it existed before", async () => {
            const childAdded = sinon.spy();
            env.database.ref(RealtimeDBKeys.CHAT_USERS).on("child_added", ds => {
                childAdded(ds.val());
            });
            const childChanged = sinon.spy();
            env.database.ref(RealtimeDBKeys.CHAT_USERS).on("child_changed", ds => {
                childChanged(ds.val());
            });

            await repository.addMessage(account, msg);
            await BluebirdPromise.delay(200);
            await repository.addMessage(account, msg);

            expect(childAdded.callCount, "childAdded.callCount").to.be.equal(1);
            expect(childChanged.callCount, "childChanged.callCount").to.be.equal(1);

            const createdUser: ChatUser = childAdded.firstCall.args[0];
            const modifiedUser: ChatUser = childChanged.firstCall.args[0];
            expect(modifiedUser.lastSeenTimestampMs).to.be.greaterThan(createdUser.lastSeenTimestampMs);
            expect(createdUser.displayName).to.be.equal(modifiedUser.displayName);
        });
    });

});
