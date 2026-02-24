type ToastOptions = {
  title: string;
  description?: string;
  duration?: number;
  color?: 'green' | 'red' | 'orange' | 'gray';
};

type Toast = ToastOptions & {
  id: number;
};

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
  function add(options: ToastOptions) {
    const id = nextId++;
    const duration = options.duration ?? 4000;
    toasts.value.push({ ...options, id });
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }

  function remove(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) toasts.value.splice(index, 1);
  }

  return { toasts, add, remove };
}
