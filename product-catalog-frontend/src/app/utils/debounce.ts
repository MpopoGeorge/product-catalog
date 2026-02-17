import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export function createDebouncedSubject<T>(delay: number = 300) {
  const subject = new Subject<T>();
  return {
    next: (value: T) => subject.next(value),
    pipe: () => subject.pipe(
      debounceTime(delay),
      distinctUntilChanged()
    )
  };
}
