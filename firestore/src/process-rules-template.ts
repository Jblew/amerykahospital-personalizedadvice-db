// tslint:disable no-console
import * as fs from "fs";

import { FirestoreCollectionKeys, RoleKey } from "./context";
/**
 *
 * Variables
 */

const definedVariables: { [x: string]: string } = Object.freeze({
    role_medicalprofessional: RoleKey.medicalprofessional,
    role_provisioner: RoleKey.provisioner,
    collection_advice: FirestoreCollectionKeys.ADVICES_COLLECTION_KEY,
    collection_advice_demo: FirestoreCollectionKeys.DEMO_ADVICES_COLLECTION_KEY,
    collection_medicalprofessional: FirestoreCollectionKeys.MEDICALPROFESSIONAL_COLLECTION_KEY,
});

/**
 *
 * Processing
 */
const data = fs.readFileSync(0, "utf-8");

const matchedExprs = data.match(/§([^§]+)§/gm);
if (!matchedExprs) errorExit("No variables found");

let output: string = data;
for (const variableExpr of matchedExprs!) {
    const variable = variableExpr.substring(1, variableExpr.length - 1);
    output = replaceVariable(output, variable);
}
console.log(output);

//
function replaceVariable(input: string, variable: string): string {
    if (!definedVariables.hasOwnProperty(variable)) {
        errorExit(`Variable ${variable} is not defined`);
    }
    return input.replace("§" + variable + "§", definedVariables[variable]);
}

function errorExit(msg: string) {
    console.error(msg);
    process.exit(1);
}
