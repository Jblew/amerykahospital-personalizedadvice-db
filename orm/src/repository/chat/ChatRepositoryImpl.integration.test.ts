import {
    Account,
    ChatMessage,
    ChatRepository,
    ChatUser,
    PendingChatMessage,
} from "amerykahospital-personalizedadvice-businesslogic";
import * as fs from "fs";
import * as path from "path";

import { IntegrationTestsEnvironment } from "../../_test/IntegrationTestsEnvironment";
import { _, BluebirdPromise, expect, sinon, uuid } from "../../_test/test_environment";
import { RealtimeDBKeys } from "../../config/RealtimeDbKeys";

import { ChatRepositoryFactory } from "./ChatRepositoryFactory";
describe("ChatRepositoryImpl", function() {
    const env = new IntegrationTestsEnvironment();
    const rules = fs.readFileSync(path.resolve(__dirname, "../../../../realtimedb/database.rules.json"), "UTF-8");
    env.setDatabaseRules(rules);

    let repository: ChatRepository;
    beforeEach(async () => await env.prepareEach({ admin: true }));
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

    ["listToChannel", "listToUid"].forEach(test =>
        describe(test, function() {
            const channelA = `chan-${uuid()}`;
            const channelB = `chan-${uuid()}`;
            const account = sampleAccount();
            const uidA = `uid-${uuid()}`;
            const uidB = `uid-${uuid()}`;
            const msgsToChannelA = _.range(0, 10).map(i => sampleMessage({ toChannel: channelA }));
            const msgsToChannelB = _.range(0, 10).map(i => sampleMessage({ toChannel: channelB }));
            const msgsToUidA = _.range(0, 10).map(i => sampleMessage({ toUid: uidA }));
            const msgsToUidB = _.range(0, 10).map(i => sampleMessage({ toUid: uidB }));

            beforeEach(async () => {
                for (const msg of [...msgsToChannelA, ...msgsToChannelB, ...msgsToUidA, ...msgsToUidB]) {
                    await repository.addMessage(account, msg);
                    await BluebirdPromise.delay(10);
                }
            });

            let recvMsgs: ChatMessage[] = [];
            beforeEach(async () => {
                if (test === "listToChannel") {
                    recvMsgs = await repository.listToChannel(channelA);
                } else {
                    recvMsgs = await repository.listToUid(uidA);
                }
            });

            it("Lists only messages sent to this channel/uid", () => {
                const expectedMsgs = test === "listToChannel" ? msgsToChannelA : msgsToUidA;

                expect(recvMsgs.length).to.be.equal(expectedMsgs.length);
                expect(recvMsgs.map(v => v.message)).to.have.members(expectedMsgs.map(v => v.message));
            });

            it("Sorts messages by timestamp", () => {
                let prevTimestamp = Number.MAX_VALUE;

                for (const msg of recvMsgs) {
                    const currTimestamp = msg.timestampMs;
                    expect(currTimestamp).to.be.lessThan(prevTimestamp);
                    prevTimestamp = currTimestamp;
                }
            });
        }),
    );

    describe("listUsersWithRole", function() {
        const accountsAndRoles = [
            {
                role: ChatUser.Role.MEDICALPROFESSIONAL,
                account: sampleAccount(),
            },
            {
                role: ChatUser.Role.MEDICALPROFESSIONAL,
                account: sampleAccount(),
            },
            {
                role: ChatUser.Role.SERVICE,
                account: sampleAccount(),
            },
            {
                role: undefined,
                account: sampleAccount(),
            },
        ];

        beforeEach(async () => {
            for (const accountRolePair of accountsAndRoles) {
                if (accountRolePair.role) {
                    await repository.setUserRole(accountRolePair.account, accountRolePair.role as ChatUser.Role.Type);
                } else {
                    // this is the only way to create user with undefined role
                    await repository.addMessage(accountRolePair.account, sampleMessage({ toChannel: "a" }));
                }
            }
        });

        it("Lists only users that do have a role", async () => {
            const role = ChatUser.Role.MEDICALPROFESSIONAL;
            const recvUsers = await repository.listUsersWithRole(role);
            expect(recvUsers.length).to.be.equal(2);
            expect(recvUsers.map(u => u.uid)).to.have.members(
                [accountsAndRoles[0], accountsAndRoles[1]].map(ar => ar.account.uid),
            );
        });
    });

    [
        {
            methodName: "listenForMessagesToChannel",
            selectorName: "channel",
            listenerFn: (selector: string, cb: ChatRepository.MessageCallback) =>
                repository.listenForMessagesToChannel(selector, cb),
            adderFn: (selector: string) =>
                repository.addMessage(sampleAccount(), sampleMessage({ toChannel: selector })),
        },
        {
            methodName: "listenForMessagesToUid",
            selectorName: "uid",
            listenerFn: (selector: string, cb: ChatRepository.MessageCallback) =>
                repository.listenForMessagesToUid(selector, cb),
            adderFn: (selector: string) => repository.addMessage(sampleAccount(), sampleMessage({ toUid: selector })),
        },
    ].forEach(test =>
        describe(test.methodName, function() {
            const selector = `sel-${uuid()}`;

            async function obscure() {
                await repository.addMessage(sampleAccount(), sampleMessage({ toUid: uuid() }));
                await repository.addMessage(sampleAccount(), sampleMessage({ toUid: uuid() }));
                await repository.addMessage(sampleAccount(), sampleMessage({ toChannel: uuid() }));
                await repository.addMessage(sampleAccount(), sampleMessage({ toChannel: uuid() }));
            }

            it(
                `Callback is fired only when message is added to the ${test.selectorName} ` +
                    `and only until cancel is called`,
                async () => {
                    const cb = sinon.spy();
                    const { cancel } = test.listenerFn(selector, cb);
                    obscure();
                    const n = 3;
                    _.times(n, () => test.adderFn(selector));

                    expect(cb.callCount).to.be.equal(n);
                    cancel();
                    _.times(n, () => test.adderFn(selector));
                    expect(cb.callCount).to.be.equal(n);
                },
            );
        }),
    );
});
