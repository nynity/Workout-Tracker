// WorkoutPlan class
class WorkoutPlan {
    constructor() {
        this.groups = [];
        this.sessions = [];
        this.load();
    }

    addGroup(name) {
        this.groups.push({
            id: Date.now().toString(),
            name: name,
            exercises: [],
            lastStartedDate: null
        });
        this.save();
    }

    addExercise(groupId, name, targetSets = 3, targetReps = 15) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.exercises.push({
                id: Date.now().toString(),
                name: name,
                targetSets: targetSets,
                targetReps: targetReps
            });
            this.save();
        }
    }

    updateExercise(groupId, exerciseId, name, targetSets, targetReps) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const exercise = group.exercises.find(e => e.id === exerciseId);
            if (exercise) {
                exercise.name = name;
                exercise.targetSets = targetSets;
                exercise.targetReps = targetReps;
                this.save();
            }
        }
    }

    startWorkout(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.lastStartedDate = new Date();
            const session = {
                id: Date.now().toString(),
                groupId: groupId,
                date: new Date(),
                sets: []
            };
            this.sessions.push(session);
            this.save();
            return session;
        }
    }

    addSet(sessionId, exerciseId, reps, bandColor, difficulty) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            session.sets.push({
                id: Date.now().toString(),
                exerciseId: exerciseId,
                reps: reps,
                bandColor: bandColor,
                difficulty: difficulty
            });
            this.save();
        }
    }

    save() {
        localStorage.setItem('workoutPlanner', JSON.stringify({
            groups: this.groups,
            sessions: this.sessions
        }));
    }

    load() {
        const data = JSON.parse(localStorage.getItem('workoutPlanner'));
        if (data) {
            this.groups = data.groups || [];
            this.sessions = data.sessions || [];
        }
    }
}

// Initialize the app
const workoutPlan = new WorkoutPlan();
let currentSession = null;
let currentExercise = null;

// DOM elements
const groupList = document.getElementById('groupList');
const addGroupBtn = document.getElementById('addGroupBtn');
const newGroupName = document.getElementById('newGroupName');
const currentWorkout = document.getElementById('currentWorkout');
const workoutGroups = document.getElementById('workoutGroups');
const exerciseList = document.getElementById('exerciseList');
const exerciseForm = document.getElementById('exerciseForm');
const recordSetBtn = document.getElementById('recordSetBtn');
const finishWorkoutBtn = document.getElementById('finishWorkoutBtn');
const recordedSets = document.getElementById('recordedSets');
const setNumber = document.getElementById('setNumber');
const repsSpan = document.getElementById('reps');
const difficultySpan = document.getElementById('difficulty');
const bandColor = document.getElementById('bandColor');
const currentWorkoutName = document.getElementById('currentWorkoutName');
const currentExerciseName = document.getElementById('currentExerciseName');

// Modal elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalSets = document.getElementById('modalSets');
const modalReps = document.getElementById('modalReps');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

// Event listeners
addGroupBtn.addEventListener('click', showAddGroupModal);
recordSetBtn.addEventListener('click', recordSet);
finishWorkoutBtn.addEventListener('click', finishWorkout);
modalSaveBtn.addEventListener('click', handleModalSave);
modalCancelBtn.addEventListener('click', closeModal);
// Functions
function renderGroups() {
    groupList.innerHTML = '';
    workoutPlan.groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.classList.add('group');
        groupElement.innerHTML = `
            <h3>${group.name}</h3>
            <button onclick="toggleExercises('${group.id}')">Toggle Exercises</button>
            <button onclick="startWorkout('${group.id}')">Start Workout</button>
            <button onclick="showAddExerciseModal('${group.id}')">Add Exercise</button>
            <div id="exercises-${group.id}" class="exercises" style="display: none;"></div>
        `;
        groupList.appendChild(groupElement);
        renderExercises(group);
    });
}

function toggleExercises(groupId) {
    const exercisesDiv = document.getElementById(`exercises-${groupId}`);
    exercisesDiv.style.display = exercisesDiv.style.display === 'none' ? 'block' : 'none';
}

function renderExercises(group) {
    const exercisesDiv = document.getElementById(`exercises-${group.id}`);
    exercisesDiv.innerHTML = '';
    group.exercises.forEach(exercise => {
        const exerciseElement = document.createElement('div');
        exerciseElement.innerHTML = `
            <p>${exercise.name} (${exercise.targetSets} sets, ${exercise.targetReps} reps)</p>
            <button onclick="showEditExerciseModal('${group.id}', '${exercise.id}')">Edit</button>
        `;
        exercisesDiv.appendChild(exerciseElement);
    });
}

function showAddGroupModal() {
    modalTitle.textContent = 'Add New Group';
    modalInput.value = '';
    modalSets.style.display = 'none';
    modalReps.style.display = 'none';
    modal.style.display = 'block';
    modalSaveBtn.onclick = addGroup;
}

function showAddExerciseModal(groupId) {
    modalTitle.textContent = 'Add New Exercise';
    modalInput.value = '';
    modalSets.style.display = 'inline';
    modalReps.style.display = 'inline';
    modal.style.display = 'block';
    modalSaveBtn.onclick = () => addExercise(groupId);
}

function showEditExerciseModal(groupId, exerciseId) {
    const group = workoutPlan.groups.find(g => g.id === groupId);
    const exercise = group.exercises.find(e => e.id === exerciseId);
    modalTitle.textContent = 'Edit Exercise';
    modalInput.value = exercise.name;
    modalSets.value = exercise.targetSets;
    modalReps.value = exercise.targetReps;
    modalSets.style.display = 'inline';
    modalReps.style.display = 'inline';
    modal.style.display = 'block';
    modalSaveBtn.onclick = () => editExercise(groupId, exerciseId);
}

function closeModal() {
    modal.style.display = 'none';
}

function handleModalSave() {
    modalSaveBtn.onclick();
    closeModal();
}

function addGroup() {
    const name = modalInput.value.trim();
    if (name) {
        workoutPlan.addGroup(name);
        renderGroups();
    }
}

function addExercise(groupId) {
    const name = modalInput.value.trim();
    const targetSets = parseInt(modalSets.value);
    const targetReps = parseInt(modalReps.value);
    if (name) {
        workoutPlan.addExercise(groupId, name, targetSets, targetReps);
        renderGroups();
    }
}

function editExercise(groupId, exerciseId) {
    const name = modalInput.value.trim();
    const targetSets = parseInt(modalSets.value);
    const targetReps = parseInt(modalReps.value);
    if (name) {
        workoutPlan.updateExercise(groupId, exerciseId, name, targetSets, targetReps);
        renderGroups();
    }
}

function startWorkout(groupId) {
    currentSession = workoutPlan.startWorkout(groupId);
    const group = workoutPlan.groups.find(g => g.id === groupId);
    workoutGroups.style.display = 'none';
    currentWorkout.style.display = 'block';
    currentWorkoutName.textContent = group.name;
    renderExerciseList(group);
}

function renderExerciseList(group) {
    exerciseList.innerHTML = '';
    group.exercises.forEach(exercise => {
        const exerciseElement = document.createElement('div');
        exerciseElement.innerHTML = `
            <h3>${exercise.name}</h3>
            <p>Target: ${exercise.targetSets} sets, ${exercise.targetReps} reps</p>
            <button onclick="selectExercise('${exercise.id}')">Select</button>
        `;
        exerciseList.appendChild(exerciseElement);
    });
}

function selectExercise(exerciseId) {
    const group = workoutPlan.groups.find(g => g.id === currentSession.groupId);
    currentExercise = group.exercises.find(e => e.id === exerciseId);
    currentExerciseName.textContent = currentExercise.name;
    exerciseForm.style.display = 'block';
    updateSetNumber();
    renderRecordedSets();
}

function updateSetNumber() {
    const completedSets = currentSession.sets.filter(set => set.exerciseId === currentExercise.id).length;
    setNumber.textContent = `${completedSets + 1} of ${currentExercise.targetSets}`;
}

function recordSet() {
    if (currentSession && currentExercise) {
        const reps = parseInt(repsSpan.textContent);
        const difficulty = parseInt(difficultySpan.textContent);
        
        workoutPlan.addSet(currentSession.id, currentExercise.id, reps, bandColor.value, difficulty);
        updateSetNumber();
        renderRecordedSets();
        
        // Reset form to default values
        repsSpan.textContent = '15';
        difficultySpan.textContent = '3';
        bandColor.value = 'Green';
    }
}

function renderRecordedSets() {
    recordedSets.innerHTML = '<h3>Recorded Sets</h3>';
    const sets = currentSession.sets.filter(set => set.exerciseId === currentExercise.id);
    sets.forEach((set, index) => {
        const setElement = document.createElement('div');
        setElement.innerHTML = `
            <p>Set ${index + 1}: ${set.reps} reps, ${set.bandColor} band, difficulty ${set.difficulty}</p>
        `;
        recordedSets.appendChild(setElement);
    });
}

function finishWorkout() {
    currentSession = null;
    currentExercise = null;
    workoutGroups.style.display = 'block';
    currentWorkout.style.display = 'none';
    alert('Workout finished!');
}

function adjustReps(amount) {
    const currentReps = parseInt(repsSpan.textContent);
    repsSpan.textContent = Math.max(1, currentReps + amount);
}

function adjustDifficulty(amount) {
    const currentDifficulty = parseInt(difficultySpan.textContent);
    difficultySpan.textContent = Math.max(1, Math.min(5, currentDifficulty + amount));
}

// Initial render
renderGroups();