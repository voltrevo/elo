import { Analysis, AnalysisFragment } from '../../analyze';
import never from '../../helpers/never';

export default class AnalysisBuilder {
  analysis: Analysis = {
    tokens: [],
    words: [],
    duration: 0,
    complete: false,
  };

  add(fragment: AnalysisFragment) {
    switch (fragment.type) {
      case 'token': {
        this.analysis = {
          ...this.analysis,
          tokens: [...this.analysis.tokens, fragment.value],
          duration: fragment.value.start_time ?? this.analysis.duration,
        };

        break;
      }

      case 'word': {
        this.analysis = {
          ...this.analysis,
          words: [...this.analysis.words, fragment.value],
          duration: fragment.value.start_time ?? this.analysis.duration,
        };

        break;
      }

      case 'disfluent': {
        // Do nothing (demo app only uses disfluent:true from regular words which doesn't
        // include disfluents that are formed from multiple words)
        break;
      }

      case 'progress': {
        // Enhancement: Latency monitoring
        break;
      }

      case 'error': {
        console.error('Transcription error', fragment.value.message);

        break;
      }

      case 'debug': {
        console.log('Transcription debug:', fragment.value.message);
        break;
      }

      case 'end': {
        this.analysis = {
          ...this.analysis,
          duration: fragment.value.duration,
          complete: true,
        };

        console.log({ analysis: this.analysis });

        break;
      }

      default: {
        never(fragment);
      }
    }
  }
}
