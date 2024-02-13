import { ListenerOptions } from '../lib/types.js';
import { EventEmitter } from 'events';
import { BaseListenerHandler } from './ListenerHandler.js';

export abstract class BaseListener {
  /**
   * Unique id of the Listener.
   */
  public id: string;

  /**
   * The emitter which emits specified event.
   */
  public emitter: EventEmitter;

  /**
   * The event to listen for.
   */
  public event: string;

  /**
   * The handler of the listener.
   */
  public listenerHandler?: BaseListenerHandler;

  /**
   * The method to use when listening for the event. Defaults to "on".
   */
  public method: string;

  /**
   * @param id - The unique id of the listener.
   * @param options - Options.
   */
  constructor(id: string, {
    emitter,
    event,
    method = 'on'
  }: ListenerOptions) {
    this.id = id;
    this.emitter = emitter;
    this.event = event;
    this.method = method;
  }

  /**
   * The function which gets executed on specified event.
   * @param value - Any object which the event returns. 
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public execute(value: unknown) {
    throw new Error(`Execute function cannot be empty. ${this.id}`);
  }
}