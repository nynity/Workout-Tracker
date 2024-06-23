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
const addGroupForm = document.getElementById('addGroupForm');
const newGroupName = document.getElementById('newGroupName');
const currentWorkout = document.getElementById('currentWorkout');
const exerciseSelect = document.getElementById('exerciseSelect');
const exerciseDetails = document.getElementById('exerciseDetails');
const recordSetForm = document.getElementById('recordSetForm');
const finishWorkoutBtn = document.getElementById('finishWorkoutBtn');
const recordedSets = document.getElementById('recordedSets');
const setNumber = document.getElementById('setNumber');

// Event listeners
addGroupForm.addEventListener('submit', addGroup);
recordSetForm.addEventListener('submit', recordSet);
finishWorkoutBtn.addEventListener('click', finishWorkout);
exerciseSelect.addEventListener('change', updateExerciseDetails);

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
            <button onclick="addExercise('${group.id}')">Add Exercise</button>
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
            <button onclick="editExercise('${group.id}', '${exercise.id}')">Edit</button>
        `;
        exercisesDiv.appendChild(exerciseElement);
    });
}

function addGroup(e) {
    e.preventDefault();
    const name = newGroupName.value.trim();
    if (name) {
        workoutPlan.addGroup(name);
        newGroupName.value = '';
        renderGroups();
    }
}

function addExercise(groupId) {
    const name = prompt('Enter exercise name:');
    if (name) {
        const targetSets = parseInt(prompt('Enter target sets:', '3')) || 3;
        const targetReps = parseInt(prompt('Enter target reps:', '15')) || 15;
        workoutPlan.addExercise(groupId, name, targetSets, targetReps);
        renderGroups();
    }
}

function editExercise(groupId, exerciseId) {
    const group = workoutPlan.groups.find(g => g.id === groupId);
    const exercise = group.exercises.find(e => e.id === exerciseId);
    const name = prompt('Enter new exercise name:', exercise.name);
    if (name) {
        const targetSets = parseInt(prompt('Enter new target sets:', exercise.targetSets)) || exercise.targetSets;
        const targetReps = parseInt(prompt('Enter new target reps:', exercise.targetReps)) || exercise.targetReps;
        workoutPlan.updateExercise(groupId, exerciseId, name, targetSets, targetReps);
        renderGroups();
    }
}

function startWorkout(groupId) {
    currentSession = workoutPlan.startWorkout(groupId);
    const group = workoutPlan.groups.find(g => g.id === groupId);
    currentWorkout.style.display = 'block';
    populateExerciseSelect(group);
    updateExerciseDetails();
}

function populateExerciseSelect(group) {
    exerciseSelect.innerHTML = '';
    group.exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise.id;
        option.textContent = exercise.name;
        exerciseSelect.appendChild(option);
    });
}

function updateExerciseDetails() {
    const groupId = currentSession.groupId;
    const group = workoutPlan.groups.find(g => g.id === groupId);
    const exerciseId = exerciseSelect.value;
    currentExercise = group.exercises.find(e => e.id === exerciseId);
    
    exerciseDetails.innerHTML = `
        <p>Target: ${currentExercise.targetSets} sets, ${currentExercise.targetReps} reps</p>
    `;
    
    updateSetNumber();
    renderRecordedSets();
}

function updateSetNumber() {
    const completedSets = currentSession.sets.filter(set => set.exerciseId === currentExercise.id).length;
    setNumber.textContent = `${completedSets + 1} of ${currentExercise.targetSets}`;
}

function recordSet(e) {
    e.preventDefault();
    if (currentSession && currentExercise) {
        const reps = document.getElementById('reps').value;
        const bandColor = document.getElementById('bandColor').value;
        const difficulty = document.getElementById('difficulty').value;
        
        workoutPlan.addSet(currentSession.id, currentExercise.id, reps, bandColor, difficulty);
        updateSetNumber();
        renderRecordedSets();
        recordSetForm.reset();
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
    currentWorkout.style.display = 'none';
    alert('Workout finished!');
}

function adjustReps(amount) {
    const repsInput = document.getElementById('reps');
    repsInput.value = Math.max(1, parseInt(repsInput.value) + amount);
}

function adjustDifficulty(amount) {
    const difficultyInput = document.getElementById('difficulty');
    difficultyInput.value = Math.max(1, Math.min(5, parseInt(difficultyInput.value) + amount));
}

// Initial render
renderGroups();