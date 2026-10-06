export function normalizeServiceUrl(address, variableName) {
    if (!address) {
        throw new Error(`${variableName} environment variable is required`);
    }

    return /^https?:\/\//i.test(address)
        ? address
        : `http://${address}`;
}
