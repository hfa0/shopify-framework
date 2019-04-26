enum QUEUESTATE {
  'IDLE' = 'IDLE',
  'RUNNING' = 'RUNNING',
  'ENDED' = 'ENDED',
  'CANCELED' = 'CANCELED'
}

export class Queue {

  private state: QUEUESTATE = QUEUESTATE.IDLE;
  
  constructor(public readonly id: number, private task: Function) {
  }

  getState() {
    return this.state;
  }

  run = async (finished) => {
    if (this.state === QUEUESTATE.IDLE) {
      this.state = QUEUESTATE.RUNNING;
      this.task();
      this.state = QUEUESTATE.ENDED;
      return finished(true);
    }
    finished(false);
  }
}


export class TaskManager {

  private maxQueues: number = 5;
  private maxParallelQueues: number = 2;
  private waitingQueues: Queue[];
  private parallelQueues: Queue[];
  private jobCount = 0;
  
  public addQueue(method: Function):void {
    if (!this.isMaxQueues()) {
      const queue = new Queue(this.jobCount, method);
      this.jobCount++;
      this.waitingQueues.push(queue);
      this.nextQueue();
    } 
  }

  private nextQueue(): void {
    if (!this.isMaxParallelQueues()) {
      const firstQueue = this.waitingQueues.shift();
      this.parallelQueues.push(firstQueue);
      firstQueue.run(finished => {
        this.nextQueue();
      })
    }
  }

  private isMaxQueues(): boolean { 
    const waiting = this.waitingQueues.filter((q) => q.getState()===QUEUESTATE.IDLE).length;
    const running = this.parallelQueues.filter((q) => q.getState()!==QUEUESTATE.ENDED).length;
    return ( waiting + running) >= this.maxQueues;
  }
  private isMaxParallelQueues(): boolean {
    const running = this.parallelQueues.filter((q) => q.getState()!==QUEUESTATE.ENDED).length;
    return running >= this.maxParallelQueues;
  }

  public isRunning(): boolean {
    return this.parallelQueues.some((q) => q.getState()===QUEUESTATE.RUNNING);
  }
}

