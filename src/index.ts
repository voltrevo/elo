import * as deepspeech from 'deepspeech';

function totalTime(hrtimeValue: number[]): string {
  return (hrtimeValue[0] + hrtimeValue[1] / 1000000000).toPrecision(4);
}

const modelPath = `${process.env.HOME}/data/deepspeech-exp/deepspeech-0.9.3-models.pbmm`;

console.error('Loading model from file %s', modelPath);
const modelLoadStart = process.hrtime();
let model = new deepspeech.Model(modelPath);
const modelLoadEnd = process.hrtime(modelLoadStart);
console.error('Loaded model in %ds.', totalTime(modelLoadEnd));

// if (args.beam_width) {
//   model.setBeamWidth(args.beam_width);
// }
