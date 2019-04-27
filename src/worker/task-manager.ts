import { IncomingEventData } from ".";
import { ModuleName } from "../modules";

enum QUEUESTATE {
  'IDLE' = 'IDLE',
  'RUNNING' = 'RUNNING',
  'ENDED' = 'ENDED',
  'CANCELED' = 'CANCELED'
}

export class Queue {

  private state: QUEUESTATE = QUEUESTATE.IDLE;
  private job: string;
  private module: ModuleName;
  constructor(
    public readonly id: number, 
    private task: Function,
    data: IncomingEventData) {
      this.job = data.job;
      this.module = data.event;
  }

  getState() {
    return this.state;
  }

  run = async (finished) => {
    if (this.state === QUEUESTATE.IDLE) {
      console.log("server", "running task", this.module, this.job);
      this.state = QUEUESTATE.RUNNING;
      await this.task();
      this.state = QUEUESTATE.ENDED;
      return finished(true);
    }
    finished(false);
  }
}


export class TaskManager {

  private maxQueues: number = 5;
  private maxParallelQueues: number = 2;
  private waitingQueues: Queue[] = [];
  private parallelQueues: Queue[] = [];
  private jobCount = 0;
  
  public addQueue(method: Function, data: IncomingEventData): void {
    if (!this.isMaxQueues()) {
      console.log("server", "add queue", this.jobCount, data.event, data.job)
      const queue = new Queue(this.jobCount, method, data);
      this.jobCount++;
      this.waitingQueues.push(queue);
      this.nextQueue();
    } 
  }

  private nextQueue(): void {
    if (!this.isMaxParallelQueues() && this.isQueueWaiting()) {
      console.log("server", "next queue")
      const firstQueue = this.waitingQueues.shift();
      this.parallelQueues.push(firstQueue);
      firstQueue.run(finished => {
        this.nextQueue();
      })
    }
  }

  private isMaxQueues(): boolean { 
    const waiting = this.waitingQueues.filter((q) => q.getState()===QUEUESTATE.IDLE).length;
    const running = this.parallelQueues.filter((q) => q.getState()===QUEUESTATE.RUNNING).length;
    return ( waiting + running) >= this.maxQueues;
  }

  private isMaxParallelQueues(): boolean {
    const running = this.parallelQueues.filter((q) => q.getState()===QUEUESTATE.RUNNING).length;
    return running >= this.maxParallelQueues;
  }

  private isQueueWaiting(): boolean { 
    return this.waitingQueues.some((q) => q.getState()===QUEUESTATE.IDLE);
  }

  public isRunning(): boolean {
    return this.parallelQueues.some((q) => q.getState()===QUEUESTATE.RUNNING);
  }
}

