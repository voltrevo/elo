const ensureType = <CheckT>() => <T extends CheckT>(value: T) => value;

export default ensureType;
