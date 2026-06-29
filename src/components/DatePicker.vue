<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth())
const pickerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({})

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const calendarDays = computed(() => {
  const year = selectedYear.value
  const month = selectedMonth.value
  const totalDays = daysInMonth(year, month)
  const startDay = firstDayOfMonth(year, month)
  const days: (number | null)[] = []

  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i)
  }

  return days
})

const parsedValue = computed(() => {
  if (!props.modelValue) return null
  const d = new Date(props.modelValue + 'T12:00:00')
  if (isNaN(d.getTime())) return null
  return d
})

const displayValue = computed(() => {
  if (!parsedValue.value) return ''
  return parsedValue.value.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
})

function isSelected(day: number) {
  if (!parsedValue.value) return false
  return (
    parsedValue.value.getDate() === day &&
    parsedValue.value.getMonth() === selectedMonth.value &&
    parsedValue.value.getFullYear() === selectedYear.value
  )
}

function isToday(day: number) {
  const today = new Date()
  return (
    day === today.getDate() &&
    selectedMonth.value === today.getMonth() &&
    selectedYear.value === today.getFullYear()
  )
}

function selectDay(day: number) {
  const d = new Date(selectedYear.value, selectedMonth.value, day, 12, 0, 0)
  const iso = d.toISOString().split('T')[0]
  emit('update:modelValue', iso || '')
  open.value = false
}

function prevMonth() {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

function nextMonth() {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

async function toggle() {
  if (parsedValue.value) {
    selectedYear.value = parsedValue.value.getFullYear()
    selectedMonth.value = parsedValue.value.getMonth()
  }
  open.value = !open.value

  if (open.value) {
    await nextTick()
    positionDropdown()
  }
}

function positionDropdown() {
  if (!pickerRef.value) return

  const trigger = pickerRef.value.querySelector('.date-picker-trigger') as HTMLElement
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const dropdownHeight = 320
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top

  const top = spaceBelow >= dropdownHeight || spaceBelow > spaceAbove
    ? rect.bottom + 6
    : rect.top - dropdownHeight - 6

  const left = Math.min(rect.left, window.innerWidth - 300)

  dropdownStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${Math.max(8, left)}px`,
    zIndex: 9999,
  }
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  const isInsidePicker = pickerRef.value?.contains(target)
  const isInsideDropdown = dropdownRef.value?.contains(target)
  if (!isInsidePicker && !isInsideDropdown) {
    open.value = false
  }
}

function onScroll() {
  if (open.value) positionDropdown()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('scroll', onScroll, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('scroll', onScroll, true)
})
</script>

<template>
  <div ref="pickerRef" class="date-picker">
    <div class="date-picker-trigger" :class="{ 'date-picker-open': open }" @click="toggle">
      <span class="date-picker-text" :class="{ 'date-picker-empty': !modelValue }">
        {{ displayValue || 'Seleccionar fecha' }}
      </span>
      <i class="fa-regular fa-calendar date-picker-icon"></i>
    </div>

    <Teleport to="body">
      <transition name="dropdown">
        <div v-if="open" ref="dropdownRef" class="date-picker-dropdown" :style="dropdownStyle">
          <div class="date-picker-header">
            <button class="date-picker-nav" aria-label="Mes anterior" @click="prevMonth">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="date-picker-month">{{ months[selectedMonth] }} {{ selectedYear }}</span>
            <button class="date-picker-nav" aria-label="Mes siguiente" @click="nextMonth">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div class="date-picker-weekdays">
            <span v-for="day in weekDays" :key="day" class="date-picker-weekday">{{ day }}</span>
          </div>

          <div class="date-picker-grid">
            <template v-for="(day, i) in calendarDays" :key="i">
              <div v-if="day === null" class="date-picker-day date-picker-day-empty"></div>
              <button
                v-else
                class="date-picker-day"
                :class="{
                  'date-picker-day-selected': isSelected(day),
                  'date-picker-day-today': isToday(day),
                }"
                @click="selectDay(day)"
              >
                {{ day }}
              </button>
            </template>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.date-picker {
  position: relative;
  width: 100%;
}

.date-picker-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
  min-height: 39px;

  &:hover {
    border-color: $gray-400;
  }

  &.date-picker-open {
    border-color: $gray-500;
  }
}

.date-picker-text {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 400;
  color: $text-primary;

  &.date-picker-empty {
    color: $text-muted;
  }
}

.date-picker-icon {
  font-size: 0.9375rem;
  color: $text-muted;
  flex-shrink: 0;
}

.date-picker-dropdown {
  width: 280px;
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 0.875rem;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.10),
    0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 1rem;
  overflow: hidden;
}

.date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.date-picker-nav {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-color;
  border-radius: 0.5rem;
  background: none;
  color: $text-secondary;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s ease;

  &:hover {
    background-color: $bg-surface-secondary;
    color: $text-primary;
  }
}

.date-picker-month {
  font-size: 0.9375rem;
  font-weight: 600;
  color: $text-primary;
}

.date-picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
  margin-bottom: 0.25rem;
}

.date-picker-weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: $text-muted;
  padding: 0.375rem 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.date-picker-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
}

.date-picker-day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: none;
  border-radius: 0.5rem;
  background: none;
  font-size: 0.8125rem;
  font-weight: 500;
  color: $text-primary;
  cursor: pointer;
  transition: all 0.12s ease;
  -webkit-tap-highlight-color: transparent;

  &:hover:not(.date-picker-day-empty):not(.date-picker-day-selected) {
    background-color: $bg-surface-secondary;
  }

  &.date-picker-day-today {
    border: 1px solid $border-color;
    font-weight: 600;
  }

  &.date-picker-day-selected {
    background-color: $primary;
    color: $white;
    font-weight: 600;
  }

  &.date-picker-day-empty {
    cursor: default;
  }
}

.dropdown-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 480px) {
  .date-picker-dropdown {
    width: calc(100vw - 32px);
    min-width: 260px;
    max-width: 320px;
  }

  .date-picker-day {
    font-size: 0.875rem;
    min-height: 38px;
  }

  .date-picker-trigger {
    min-height: 44px;
    padding: 0.625rem 0.75rem;
  }
}
</style>
