# PhETMods
Modifying PhET Simulations for our student use.


## Running on local machine instructions

- Start by installing [NodeJS](https://nodejs.org/en/) if you don't already have it.
- Then you need to install a few packages for node. Open Powershell or Terminal and run:

```bash
npm install -g http-server
npm install -g grunt-cli
npm config set save false
```

- You may need to use sudo if on Mac/Linux.
- Next clone the repo to a folder on your computer.
- Open Powershell or Terminal and change directory `CD` to the folder you just cloned.
- Now in your Powershell/Terminal Window run

```bash
 http-server .
 ```

- Open a browser and go to [http://localhost:8080](http://localhost:8080). 
- Navigate to the simulation you want to run, e.g. pendulum-lab. 
- Open the "pendulum-lab_en.html" file.
- Enjoy simulation. 

