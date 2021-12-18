class InstanceManager {
   private readonly instances: Map<Object, Object> = new Map<Object, Object>();

   register<T>(instance: T) : T {
      this.instances.set(instance.constructor, instance);
      return instance;
   }

   get<T>(constructor: { new(...args: unknown[]): T }) : T {
      return this.instances.get(constructor) as T;
   }
}

const instance = new InstanceManager();
export { instance as InstanceManager };