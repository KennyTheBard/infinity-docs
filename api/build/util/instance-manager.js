"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceManager = void 0;
class InstanceManager {
    constructor() {
        this.instances = new Map();
    }
    register(instance) {
        this.instances.set(instance.constructor, instance);
        return instance;
    }
    get(constructor) {
        return this.instances.get(constructor);
    }
}
const instance = new InstanceManager();
exports.InstanceManager = instance;
//# sourceMappingURL=instance-manager.js.map