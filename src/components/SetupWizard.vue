<script lang="ts">
import { CallsignHelper } from '../utils/callsign';
import defaultSettings from '../settings.json';

interface WizardData {
  callsign: string;
  qth: string;
  locator: string;
  iaruRegion: 'IARU1' | 'IARU2' | 'IARU3';
  importAdif: boolean;
  enableCat: boolean;
  rigctldPath: string;
}

export default {
  name: 'SetupWizard',
  emits: ['complete'],
  data() {
    return {
      currentStep: 1,
      totalSteps: 4,
      wizardData: {
        callsign: '',
        qth: '',
        locator: '',
        iaruRegion: 'IARU1',
        importAdif: false,
        enableCat: false,
        rigctldPath: 'rigctld',
      } as WizardData,
      isValidating: false,
      validationErrors: {} as Record<string, string>,
    };
  },
  computed: {
    canProceed() {
      switch (this.currentStep) {
        case 1:
          return (
            this.wizardData.callsign.trim() !== '' &&
            this.wizardData.qth.trim() !== '' &&
            !this.validationErrors.callsign
          );
        case 2:
          return !this.validationErrors.locator;
        case 3:
          return true; // ADIF import is optional
        case 4:
          return (
            !this.wizardData.enableCat ||
            (this.wizardData.rigctldPath.trim() !== '' && !this.validationErrors.rigctldPath)
          );
        default:
          return false;
      }
    },
    isLastStep() {
      return this.currentStep === this.totalSteps;
    },
  },
  methods: {
    nextStep() {
      if (this.canProceed) {
        if (this.isLastStep) {
          this.completeSetup();
        } else {
          this.currentStep++;
        }
      }
    },
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    validateCallsign() {
      const callsign = this.wizardData.callsign.trim().toUpperCase();
      if (!callsign) {
        this.validationErrors.callsign = 'Callsign is required';
        return false;
      }

      if (!CallsignHelper.isValidCallsign(callsign)) {
        this.validationErrors.callsign = 'Invalid callsign format';
        return false;
      }

      delete this.validationErrors.callsign;
      this.wizardData.callsign = callsign;
      return true;
    },
    validateLocator() {
      const locator = this.wizardData.locator.trim().toUpperCase();
      if (locator && locator.length >= 4) {
        const locatorRegex = /^[A-R]{2}[0-9]{2}([A-X]{2})?([0-9]{2})?$/;
        if (!locatorRegex.test(locator)) {
          this.validationErrors.locator = 'Invalid locator format (e.g. JN97)';
          return false;
        }
      }

      delete this.validationErrors.locator;
      this.wizardData.locator = locator;
      return true;
    },
    async testRigctldPath() {
      if (!this.wizardData.enableCat) {
        delete this.validationErrors.rigctldPath;
        return true;
      }

      this.isValidating = true;
      try {
        const result = await window.electronAPI.executeCommand(
          `which ${this.wizardData.rigctldPath}`
        );
        if (result.success && result.data.trim()) {
          delete this.validationErrors.rigctldPath;
          return true;
        } else {
          this.validationErrors.rigctldPath = 'rigctld not found in the specified path';
          return false;
        }
      } catch {
        this.validationErrors.rigctldPath = 'Error checking rigctld path';
        return false;
      } finally {
        this.isValidating = false;
      }
    },
    async importAdifFile() {
      try {
        const result = await window.electronAPI.importAdif();
        if (result.imported) {
          console.log(`Successfully imported ${result.count} QSOs from ADIF file`);
          return true;
        } else {
          console.error('ADIF import failed:', result.error);
          return false;
        }
      } catch (error) {
        console.error('Error importing ADIF:', error);
        return false;
      }
    },
    async completeSetup() {
      // Validate all fields
      const isCallsignValid = this.validateCallsign();
      const isLocatorValid = this.validateLocator();
      const isRigctldValid = await this.testRigctldPath();

      if (!isCallsignValid || !isLocatorValid || !isRigctldValid) {
        return;
      }

      // Create settings object based on default settings
      const settings = JSON.parse(JSON.stringify(defaultSettings));

      // Update with wizard data
      settings.station.callsign = this.wizardData.callsign;
      settings.station.qth = this.wizardData.qth;
      settings.station.grid = this.wizardData.locator;
      settings.station.iaruRegion = this.wizardData.iaruRegion;

      // Add CAT settings if enabled
      if (this.wizardData.enableCat) {
        settings.rig.rigctldPath = this.wizardData.rigctldPath;
        settings.rig.enabled = true;
      }

      try {
        // Save settings first
        await window.electronAPI.saveSettings(settings);

        // Import ADIF if requested
        if (this.wizardData.importAdif) {
          await this.importAdifFile();
        }

        this.$emit('complete');
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    },
  },
};
</script>

<template>
  <div class="wizard-overlay">
    <div class="wizard-container">
      <div class="wizard-header">
        <h1>HamLogger Initial Setup</h1>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
        <p class="step-indicator">Step {{ currentStep }} of {{ totalSteps }}</p>
      </div>

      <div class="wizard-content">
        <!-- Step 1: Basic Station Info -->
        <div v-if="currentStep === 1" class="wizard-step">
          <h2>Station Information</h2>
          <p class="step-description">Please enter your basic station information.</p>

          <div class="form-group">
            <label for="callsign">Callsign *</label>
            <input
              id="callsign"
              v-model="wizardData.callsign"
              type="text"
              placeholder="e.g. HA5XB"
              @blur="validateCallsign"
              :class="{ error: validationErrors.callsign }"
            />
            <span v-if="validationErrors.callsign" class="error-message">
              {{ validationErrors.callsign }}
            </span>
          </div>

          <div class="form-group">
            <label for="qth">QTH (Location) *</label>
            <input
              id="qth"
              v-model="wizardData.qth"
              type="text"
              placeholder="e.g. Budapest, Hungary"
            />
          </div>
        </div>

        <!-- Step 2: Optional Info -->
        <div v-if="currentStep === 2" class="wizard-step">
          <h2>Additional Information</h2>
          <p class="step-description">
            These fields are optional but help improve the program's functionality.
          </p>

          <div class="form-group">
            <label for="locator">Maidenhead Locator</label>
            <input
              id="locator"
              v-model="wizardData.locator"
              type="text"
              placeholder="e.g. JN97"
              @blur="validateLocator"
              :class="{ error: validationErrors.locator }"
            />
            <span v-if="validationErrors.locator" class="error-message">
              {{ validationErrors.locator }}
            </span>
          </div>

          <div class="form-group">
            <label for="iaruRegion">IARU Region</label>
            <select id="iaruRegion" v-model="wizardData.iaruRegion">
              <option value="IARU1">
                IARU Region 1 (Europe, Africa, Middle East, Northern Asia)
              </option>
              <option value="IARU2">IARU Region 2 (Americas)</option>
              <option value="IARU3">IARU Region 3 (Asia-Pacific)</option>
            </select>
          </div>
        </div>

        <!-- Step 3: ADIF Import -->
        <div v-if="currentStep === 3" class="wizard-step">
          <h2>Import Existing Log</h2>
          <p class="step-description">
            Do you have an existing ADIF log file you'd like to import?
          </p>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="wizardData.importAdif" />
              Import ADIF file
            </label>
          </div>

          <div v-if="wizardData.importAdif" class="info-box">
            <p class="info-text">
              <strong>Note:</strong> After completing the setup, you'll be prompted to select your
              ADIF file (.adi or .adif) to import your existing QSO records.
            </p>
          </div>
        </div>

        <!-- Step 4: CAT Control -->
        <div v-if="currentStep === 4" class="wizard-step">
          <h2>CAT Control Setup</h2>
          <p class="step-description">
            Configure computer-aided transceiver control if you have a compatible radio.
          </p>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="wizardData.enableCat" />
              Enable CAT Control
            </label>
          </div>

          <div v-if="wizardData.enableCat" class="form-group">
            <label for="rigctldPath">rigctld Path</label>
            <input
              id="rigctldPath"
              v-model="wizardData.rigctldPath"
              type="text"
              placeholder="rigctld"
              @blur="testRigctldPath"
              :class="{ error: validationErrors.rigctldPath }"
            />
            <span v-if="validationErrors.rigctldPath" class="error-message">
              {{ validationErrors.rigctldPath }}
            </span>
            <span v-if="isValidating" class="info-message"> Checking rigctld availability... </span>
            <p class="help-text">
              Enter the path to rigctld executable. If rigctld is in your PATH, just enter
              "rigctld".
            </p>
          </div>
        </div>
      </div>

      <div class="wizard-footer">
        <button v-if="currentStep > 1" @click="prevStep" class="btn btn-secondary">Previous</button>
        <button @click="nextStep" :disabled="!canProceed || isValidating" class="btn btn-primary">
          {{ isLastStep ? 'Complete Setup' : 'Next' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.wizard-container {
  background: #333;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.wizard-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #444;
  text-align: center;
}

.wizard-header h1 {
  color: var(--main-color);
  margin: 0 0 1rem;
  font-size: 1.8rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #444;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--main-color);
  transition: width 0.3s ease;
}

.step-indicator {
  color: var(--gray-color);
  margin: 0;
  font-size: 0.9rem;
}

.wizard-content {
  padding: 2rem;
  min-height: 300px;
}

.wizard-step h2 {
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
}

.step-description {
  color: var(--gray-color);
  margin: 0 0 2rem;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: var(--gray-color);
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  margin-right: 0.5rem;
  width: auto;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  background: #444;
  border: 1px solid #555;
  color: #fff;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--main-color);
}

.form-group input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.info-message {
  color: var(--main-color);
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.help-text {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  line-height: 1.4;
}

.wizard-footer {
  padding: 1rem 2rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--main-color);
  color: #000;
}

.btn-primary:hover:not(:disabled) {
  background: #e6d700;
}

.btn-secondary {
  background: #555;
  color: #fff;
}

.btn-secondary:hover {
  background: #666;
}

.info-box {
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.info-text {
  color: var(--gray-color);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
