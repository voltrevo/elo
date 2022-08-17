import nil from "../../../common-pure/nil";

export default function classes(...classes_: (string | nil)[]) {
  return {
    className: classes_.filter(c => c).join(' '),
  };
}