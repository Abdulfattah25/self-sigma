// Test untuk memastikan deadline filtering bekerja dengan benar

// Mock data untuk testing
const mockTasks = [
  {
    id: 1,
    task_name: 'Task Harian',
    jenis_task: 'harian',
    date: '2025-09-08',
    deadline_date: null,
  },
  {
    id: 2,
    task_name: 'Deadline Hari Ini',
    jenis_task: 'deadline',
    date: '2025-09-07', // berbeda dengan today
    deadline_date: '2025-09-08', // sama dengan today
  },
  {
    id: 3,
    task_name: 'Deadline Besok',
    jenis_task: 'deadline',
    date: '2025-09-07', // berbeda dengan today
    deadline_date: '2025-09-09', // berbeda dengan today
  },
  {
    id: 4,
    task_name: 'Task Ad-hoc',
    jenis_task: null,
    date: '2025-09-08',
    deadline_date: null,
  },
];

const today = '2025-09-08';

// Test filtering logic
function testDeadlineFilter() {
  console.log('=== Testing Deadline Filter Logic ===');
  console.log('Today:', today);
  console.log('Raw tasks:', mockTasks.length);

  // Filter seperti di DataService
  const filteredByDataService = mockTasks.filter((task) => {
    // Jika bukan deadline task, tampilkan
    if (task.jenis_task !== 'deadline') return true;

    // Jika deadline task, hanya tampil jika deadline_date = hari ini
    return task.deadline_date === today;
  });

  console.log('After DataService filter:', filteredByDataService.length);
  filteredByDataService.forEach((t) => {
    console.log(`- ${t.task_name} (${t.jenis_task}, deadline: ${t.deadline_date})`);
  });

  // Filter seperti di Component sortedTasks
  const filteredByComponent = filteredByDataService.filter((t) => {
    // Filter deadline tasks: hanya tampil jika deadline = hari ini
    if (t.jenis_task === 'deadline' && t.deadline_date && t.deadline_date !== today) {
      return false;
    }
    return true;
  });

  console.log('After Component filter:', filteredByComponent.length);
  filteredByComponent.forEach((t) => {
    console.log(`- ${t.task_name} (${t.jenis_task}, deadline: ${t.deadline_date})`);
  });

  // Expected result: Hanya task 1, 2, dan 4 yang tampil
  const expectedIds = [1, 2, 4];
  const actualIds = filteredByComponent.map((t) => t.id);

  console.log('Expected IDs:', expectedIds);
  console.log('Actual IDs:', actualIds);
  console.log('Test passed:', JSON.stringify(expectedIds) === JSON.stringify(actualIds));
}

// Run test
testDeadlineFilter();

/* 
Expected Output:
=== Testing Deadline Filter Logic ===
Today: 2025-09-08
Raw tasks: 4
After DataService filter: 3
- Task Harian (harian, deadline: null)
- Deadline Hari Ini (deadline, deadline: 2025-09-08)
- Task Ad-hoc (null, deadline: null)
After Component filter: 3
- Task Harian (harian, deadline: null)
- Deadline Hari Ini (deadline, deadline: 2025-09-08)
- Task Ad-hoc (null, deadline: null)
Expected IDs: [1, 2, 4]
Actual IDs: [1, 2, 4]
Test passed: true
*/
