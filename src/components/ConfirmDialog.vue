<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useConfirm } from '@/composables/useConfirm'

const { state, accept, reject } = useConfirm()
</script>

<template>
  <Dialog
    :visible="state.visible"
    modal
    :style="{ width: '420px' }"
    :closable="false"
    :dismissable-mask="true"
    @hide="reject"
  >
    <div class="confirm-body">
      <div
        class="confirm-icon-wrapper"
        :class="`severity-${state.severity}`"
      >
        <i :class="state.icon"></i>
      </div>

      <h2 class="confirm-title">{{ state.title }}</h2>
      <p class="confirm-message">{{ state.message }}</p>
    </div>

    <template #footer>
      <div class="confirm-footer">
        <Button
          :label="state.rejectLabel"
          text
          class="confirm-cancel"
          autofocus
          @click="reject"
        />
        <Button
          :label="state.acceptLabel"
          :severity="state.severity === 'danger' ? 'danger' : undefined"
          :class="['confirm-accept', state.severity === 'danger' ? 'p-button-danger' : '']"
          @click="accept"
        />
      </div>
    </template>
  </Dialog>
</template>

<style lang="scss" scoped>
.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 0.5rem 0.5rem;
}

.confirm-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  border: 1px solid;
  margin-bottom: 1.25rem;
  transition: all 0.2s ease;

  i {
    font-size: 1.5rem;
    transition: color 0.2s ease;
  }

  &.severity-danger {
    background-color: rgba(239, 68, 68, 0.06);
    border-color: rgba(239, 68, 68, 0.15);

    i { color: #ef4444; }
  }

  &.severity-warn {
    background-color: rgba(245, 158, 11, 0.06);
    border-color: rgba(245, 158, 11, 0.15);

    i { color: #f59e0b; }
  }

  &.severity-info {
    background-color: rgba(99, 102, 241, 0.06);
    border-color: rgba(99, 102, 241, 0.15);

    i { color: #6366f1; }
  }
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.confirm-message {
  font-size: 0.9375rem;
  color: $text-secondary;
  margin: 0;
  line-height: 1.5;
  max-width: 320px;
}

.confirm-footer {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 0.5rem 1rem;
}

.confirm-cancel {
  min-width: 100px;
}

.confirm-accept {
  min-width: 100px;
}
</style>
