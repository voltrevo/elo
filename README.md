# Language Confidence Fluency

## Installation

These instructions were written while testing against Ubuntu 20.04.

However, most of the development was done on a Debian image, so hopefully you can get things running
on your preferred distro without too much trouble.

**Dependencies**
- Docker (`sudo apt install docker.io`)
- NodeJS (Install [nvm](https://github.com/nvm-sh/nvm), `nvm i 16`)

**Steps**
1. `npm install`
2. `npm run build`
3. `sudo docker build . -t fluency` (~4min)
4. `sudo docker run --rm -it -p36582:36582 fluency:latest`

Visit `localhost:36582` to view the frontend.

## Notes

- If this is running remotely, you need to configure access to that port, which depends on your
server infrastructure. It's entirely possible that this doesn't need to be exposed to the public
internet - you can use the api by POSTing your audio file to `/analyze`.
  - (For development, I use VS Code's remote-ssh plugin which provides secure port forwarding
    functionality.)
- GPU support has been included but it is not necessary and doesn't appear to help very much. Having
said that, I haven't tested the number of concurrent requests the server can handle, and it's very
possible the GPU would enable a much higher capacity per node. If your machine has a GPU and you'd
like to use it, you need to add the `--gpus all` flag to to the docker command above.
- The frontend has been included, which isn't actually necessary. I'm not sure it makes much
difference though, so it's included. All the analysis is done in python which has a CLI at
`analyzer/cli/py` if you'd like to abstract this out.

## Future Work Ideas

- Implement streaming
- Clean separation of API and frontend
- Minimize resulting docker image size (currently 3.16GB), especially if frontend and/or gpu aren't
needed
- Experiment with tensorflow-lite builds for increasing performance / concurrency limits
- Improve disfluent detection by updating the actual underlying model using fine-tuning
- Use fine-tuning (or from-scratch) to retrain deepspeech to recognize phonemes
- Figure out why the GPU doesn't help very much, possibly unblock GPU acceleration
- Research CPU and GPU options
- Make the embedded python server use a separate thread for each request (if it isn't already)
- Increase threshold for `<pause>` based on surrounding punctuation
