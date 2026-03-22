// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedLedger - Medical Records Management System
 * @author MedLedger Team
 * @notice Decentralized medical records management with patient-controlled access
 * @dev Records stored on IPFS; only hashes and permissions stored on-chain
 */
contract MedicalRecords {

    // ─────────────────────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────────────────────

    struct Patient {
        address wallet;
        string name;
        uint256 age;
        bool registered;
        uint256 registeredAt;
    }

    struct Doctor {
        address wallet;
        string name;
        string specialization;
        bool registered;
        uint256 registeredAt;
    }

    struct MedicalRecord {
        string ipfsHash;        // IPFS CID of the encrypted file
        string description;     // Brief description of the record
        address doctorAddress;  // Doctor who uploaded the record
        uint256 timestamp;      // Block timestamp when record was added
        string recordType;      // e.g., "Lab Report", "Prescription", "Scan"
    }

    struct AccessLog {
        address viewer;         // Address that accessed the record
        uint256 timestamp;      // When access occurred
        string action;          // "GRANT", "REVOKE", "VIEW"
    }

    // ─────────────────────────────────────────────────────────────
    //  STATE VARIABLES
    // ─────────────────────────────────────────────────────────────

    address public owner;

    // Core mappings
    mapping(address => Patient) public patients;
    mapping(address => Doctor) public doctors;
    mapping(address => MedicalRecord[]) private records;

    // permissions[patientAddress][doctorAddress] = bool
    mapping(address => mapping(address => bool)) public permissions;

    // accessLogs[patientAddress] = array of AccessLog
    mapping(address => AccessLog[]) private accessLogs;

    // Track all registered addresses
    address[] public patientList;
    address[] public doctorList;

    // ─────────────────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────────────────

    event PatientRegistered(address indexed patientAddress, string name, uint256 timestamp);
    event DoctorRegistered(address indexed doctorAddress, string name, string specialization, uint256 timestamp);
    event RecordAdded(address indexed patientAddress, address indexed doctorAddress, string ipfsHash, uint256 timestamp);
    event AccessGranted(address indexed patientAddress, address indexed doctorAddress, uint256 timestamp);
    event AccessRevoked(address indexed patientAddress, address indexed doctorAddress, uint256 timestamp);

    // ─────────────────────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "MedLedger: caller is not the owner");
        _;
    }

    modifier onlyRegisteredPatient() {
        require(patients[msg.sender].registered, "MedLedger: not a registered patient");
        _;
    }

    modifier onlyRegisteredDoctor() {
        require(doctors[msg.sender].registered, "MedLedger: not a registered doctor");
        _;
    }

    modifier patientExists(address _patient) {
        require(patients[_patient].registered, "MedLedger: patient not registered");
        _;
    }

    modifier hasAccess(address _patient) {
        require(
            permissions[_patient][msg.sender] || msg.sender == _patient,
            "MedLedger: access denied"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────
    //  REGISTRATION FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Register caller as a patient
     * @param _name Full name of the patient
     * @param _age Age of the patient
     */
    function registerPatient(string memory _name, uint256 _age) external {
        require(!patients[msg.sender].registered, "MedLedger: already registered as patient");
        require(bytes(_name).length > 0, "MedLedger: name cannot be empty");
        require(_age > 0 && _age < 150, "MedLedger: invalid age");

        patients[msg.sender] = Patient({
            wallet: msg.sender,
            name: _name,
            age: _age,
            registered: true,
            registeredAt: block.timestamp
        });

        patientList.push(msg.sender);

        emit PatientRegistered(msg.sender, _name, block.timestamp);
    }

    /**
     * @notice Register a doctor (owner only)
     * @param _doctor Wallet address of the doctor
     * @param _name Full name of the doctor
     * @param _specialization Medical specialization
     */
    function registerDoctor(
        address _doctor,
        string memory _name,
        string memory _specialization
    ) external onlyOwner {
        require(_doctor != address(0), "MedLedger: invalid address");
        require(!doctors[_doctor].registered, "MedLedger: doctor already registered");
        require(bytes(_name).length > 0, "MedLedger: name cannot be empty");

        doctors[_doctor] = Doctor({
            wallet: _doctor,
            name: _name,
            specialization: _specialization,
            registered: true,
            registeredAt: block.timestamp
        });

        doctorList.push(_doctor);

        emit DoctorRegistered(_doctor, _name, _specialization, block.timestamp);
    }

    /**
     * @notice Self-register as a doctor (for demo/testnet use)
     * @dev In production, restrict to onlyOwner flow above
     */
    function registerDoctorSelf(
        string memory _name,
        string memory _specialization
    ) external {
        require(!doctors[msg.sender].registered, "MedLedger: already registered as doctor");
        require(bytes(_name).length > 0, "MedLedger: name cannot be empty");

        doctors[msg.sender] = Doctor({
            wallet: msg.sender,
            name: _name,
            specialization: _specialization,
            registered: true,
            registeredAt: block.timestamp
        });

        doctorList.push(msg.sender);

        emit DoctorRegistered(msg.sender, _name, _specialization, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    //  ACCESS CONTROL FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Grant a doctor access to caller's medical records
     * @param _doctor Address of the doctor to grant access
     */
    function grantAccess(address _doctor) external onlyRegisteredPatient {
        require(doctors[_doctor].registered, "MedLedger: not a registered doctor");
        require(!permissions[msg.sender][_doctor], "MedLedger: access already granted");

        permissions[msg.sender][_doctor] = true;

        accessLogs[msg.sender].push(AccessLog({
            viewer: _doctor,
            timestamp: block.timestamp,
            action: "GRANT"
        }));

        emit AccessGranted(msg.sender, _doctor, block.timestamp);
    }

    /**
     * @notice Revoke a doctor's access to caller's medical records
     * @param _doctor Address of the doctor to revoke access from
     */
    function revokeAccess(address _doctor) external onlyRegisteredPatient {
        require(permissions[msg.sender][_doctor], "MedLedger: access not currently granted");

        permissions[msg.sender][_doctor] = false;

        accessLogs[msg.sender].push(AccessLog({
            viewer: _doctor,
            timestamp: block.timestamp,
            action: "REVOKE"
        }));

        emit AccessRevoked(msg.sender, _doctor, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    //  RECORD MANAGEMENT FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Add a medical record for a patient
     * @param _patient Wallet address of the patient
     * @param _ipfsHash IPFS CID of the encrypted medical file
     * @param _description Brief description of the record
     * @param _recordType Type of medical record
     */
    function addMedicalRecord(
        address _patient,
        string memory _ipfsHash,
        string memory _description,
        string memory _recordType
    ) external onlyRegisteredDoctor patientExists(_patient) {
        require(permissions[_patient][msg.sender], "MedLedger: doctor does not have access");
        require(bytes(_ipfsHash).length > 0, "MedLedger: IPFS hash cannot be empty");

        records[_patient].push(MedicalRecord({
            ipfsHash: _ipfsHash,
            description: _description,
            doctorAddress: msg.sender,
            timestamp: block.timestamp,
            recordType: _recordType
        }));

        accessLogs[_patient].push(AccessLog({
            viewer: msg.sender,
            timestamp: block.timestamp,
            action: "VIEW"
        }));

        emit RecordAdded(_patient, msg.sender, _ipfsHash, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    //  VIEW / GETTER FUNCTIONS
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Get all medical records for a patient
     * @param _patient Wallet address of the patient
     * @return Array of MedicalRecord structs
     */
    function getRecords(address _patient)
        external
        view
        patientExists(_patient)
        hasAccess(_patient)
        returns (MedicalRecord[] memory)
    {
        return records[_patient];
    }

    /**
     * @notice Get access logs for a patient (patient only)
     * @param _patient Wallet address of the patient
     * @return Array of AccessLog structs
     */
    function getAccessLogs(address _patient)
        external
        view
        returns (AccessLog[] memory)
    {
        require(msg.sender == _patient, "MedLedger: only patient can view their logs");
        return accessLogs[_patient];
    }

    /**
     * @notice Get patient information
     * @param _patient Wallet address of the patient
     */
    function getPatient(address _patient)
        external
        view
        returns (Patient memory)
    {
        require(patients[_patient].registered, "MedLedger: patient not found");
        return patients[_patient];
    }

    /**
     * @notice Get doctor information
     * @param _doctor Wallet address of the doctor
     */
    function getDoctor(address _doctor)
        external
        view
        returns (Doctor memory)
    {
        require(doctors[_doctor].registered, "MedLedger: doctor not found");
        return doctors[_doctor];
    }

    /**
     * @notice Check if a doctor has access to a patient's records
     */
    function checkAccess(address _patient, address _doctor)
        external
        view
        returns (bool)
    {
        return permissions[_patient][_doctor];
    }

    /**
     * @notice Get total number of records for a patient
     */
    function getRecordCount(address _patient)
        external
        view
        patientExists(_patient)
        returns (uint256)
    {
        return records[_patient].length;
    }

    /**
     * @notice Get list of all registered patients
     */
    function getPatientList() external view returns (address[] memory) {
        return patientList;
    }

    /**
     * @notice Get list of all registered doctors
     */
    function getDoctorList() external view returns (address[] memory) {
        return doctorList;
    }
}
