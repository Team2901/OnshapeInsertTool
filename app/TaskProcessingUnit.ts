class TaskProcessingUnit<T, GT> {
    private threads: [T[]];

    private processingFunction: (
        taskInfo: T,
        addTask: (taskInfo: T) => void,
        globalTaskInfo: GT
    ) => Promise<void>;

    public globalTaskInfo: GT;

    public threadPromises: Promise<void>[] = [];

    /**
    @param threadNumber the number of threads to create
    @returns thread processing unit with taskInfo T and globalTaskInfo GT
    */
    constructor(threadNumber: number) {
        const threads = [];
        for (let thread = 0; thread < threadNumber; thread++) {
            threads[thread] = [];
        }
        this.threads = threads as [T[]];
    }

    public setGlobalTaskInfo(globalTaskInfo: GT): void {
        //for descendant array or library id
        this.globalTaskInfo = globalTaskInfo;
    }

    public setProcessingFunction(
        processTask: (
            taskInfo: T,
            addTask: (taskInfo: T) => void,
            globalTaskInfo: GT
        ) => Promise<void>
    ): void {
        //Function(taskInfo, globalInfo, lastTaskInfo?)
        this.processingFunction = processTask;
    }

    public addTask(taskInfo: T): void {
        this.addTaskForProcessing(taskInfo, false);
    }

    private addTaskForProcessing(taskInfo: T, autoRun: boolean = true): void {
        //find thread with lowest nnumber of tasks and add here
        //restart thread if finished
        let smallestThread: number = 0;
        for (let threadNum = 0; threadNum < this.threads.length; threadNum++) {
            if (this.threads[threadNum].length < this.threads[smallestThread].length) {
                smallestThread = threadNum;
            }
        }
        this.threads[smallestThread].push(taskInfo);
        this.printStatus();
        if (autoRun && this.threads[smallestThread].length === 1) {
            //thread was empty before
            this.runThread(this.threads[smallestThread]);
        }
    }

    private runThread(thread: T[]): void {
        this.threadPromises.push(
            new Promise(async (resolve, reject) => {
                let task: T;
                for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
                    task = thread[0];
                    await this.processingFunction(
                        task,
                        (nextInfo: T) => {
                            this.addTaskForProcessing(nextInfo); //arrow function for retaining this
                        },
                        this.globalTaskInfo
                    );
                    this.printStatus();
                    thread.shift();
                    if (thread.length === 0) break;
                }
                resolve();
            })
        );
    }

    public runTasks(): Promise<void> {
        //while loop for all tasks
        //.then -> remove from thread and process next in thread
        return new Promise(async (resolve, reject) => {
            for (let thread of this.threads) {
                if (thread.length > 0) this.runThread(thread);
            }
            let threadPromise: Promise<void>;
            for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
                threadPromise = this.threadPromises[0];
                await threadPromise;
                this.threadPromises.shift();
                this.printStatus();
                if (this.threadPromises.length === 0) break;
            }
            resolve();
        });
    }

    private printStatus(): void {
        return;
        let activeThreadInfo: { [info: string]: string }[] = [];
        for (let thread of this.threads) {
            if (thread.length != 0) {
                activeThreadInfo.push({
                    tasksAlive: thread.length + '',
                });
            }
        }
        console.log('Active Threads Info', JSON.stringify(activeThreadInfo));
    }
}
export { TaskProcessingUnit };
