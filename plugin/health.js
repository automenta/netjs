/*
http://www.healthmap.org/en/
	http://www.healthmap.org/hm.server.new.php

https://www.datalanche.com/datasets
	Dialysis Facility Directory
	FDA Product Recalls
	Home Health Facility Directory
	Hospital Directory
	Nursing Home Directory
	ICD-10-CM, ICD-9-CM - The International Classification of Diseases, Clinical Modification, Ninth Revision (ICD-9-CM) includes medical codes for diagnoses and procedures. It will soon be replaced by ICD-10.
	LOINC - Logical Observation Identifiers Names and Codes (LOINC) is a universal standard for identifying medical laboratory observations developed and maintained by Regenstrief Institute, a U.S. non-profit medical research organization.
	NDC - The National Drug Code (NDC) is a unique product identifier for human drugs. We have merged the new and old FDA databases into a single, unified dataset.

http://gnuhealth.org/
    GNU Health is a free Health and Hospital Information System with the following functionality :
    - Electronic Medical Record (EMR)
    - Hospital Information System (HIS)
    - Health Information System
    Our goal is to contribute with health professionals around the world to improve the lives of the underprivileged, providing a free system that optimizes health promotion and disease prevention.
    GNU Health is an official GNU Package, and the Hospital Information System adopted by the United Nations University, International Institute for Global Health, for the implementations and trainings.

 http://healthindicators.gov/

Neurobehavioral Ontology
http://bioportal.bioontology.org/ontologies/NBO/?p=classes


http://HumanAPI.co
https://github.com/maccman/humanapi

	GET /v1/human Returns a summary of the user's current health data
	GET /v1/human/profile Returns the profile of the authenticated user
	GET /v1/human/blood_glucose Returns the most recent blood glucose reading
	GET /v1/human/blood_glucose/readings Returns a list of blood glucose readings
	GET /v1/human/blood_glucose/readings/{id} Returns a specific blood glucose reading
	GET /v1/human/blood_glucose/readings/daily/{date} Returns blood glucose readings for a specific date
	GET /v1/human/blood_oxygen Returns the most recent blood oxygen reading
	GET /v1/human/blood_oxygen/readings Returns a list of blood oxygen readings
	GET /v1/human/blood_oxygen/readings/{id} Returns a specific blood oxygen reading
	GET /v1/human/blood_oxygen/readings/daily/{date} Returns blood oxygen readings for a specific date
	GET /v1/human/blood_pressure Returns the most recent blood pressure reading
	GET /v1/human/blood_pressure/readings Returns a list of blood pressure readings
	GET /v1/human/blood_pressure/readings/{id} Returns a specific blood pressure reading
	GET /v1/human/blood_pressure/readings/daily/{date} Returns blood pressure readings for a specific date
	GET /v1/human/bmi Returns the most recent BMI reading
	GET /v1/human/bmi/readings Returns a list of BMI readings
	GET /v1/human/bmi/readings/{id} Returns a specific BMI reading
	GET /v1/human/bmi/readings/daily/{date} Returns BMI readings for a specific date
	GET /v1/human/body_fat Returns the most recent body fat reading
	GET /v1/human/body_fat/readings Returns a list of body fat readings
	GET /v1/human/body_fat/readings/{id} Returns a specific body fat reading
	GET /v1/human/body_fat/readings/daily/{date} Returns body fat readings for a specific date
	GET /v1/human/heart_rate Returns the most recent heart rate reading
	GET /v1/human/heart_rate/readings Returns a list of heart rate readings
	GET /v1/human/heart_rate/readings/{id} Returns a specific heart rate reading
	GET /v1/human/heart_rate/readings/daily/{date} Returns heart rate readings for a specific date
	GET /v1/human/height Returns the most recent height reading
	GET /v1/human/height/readings Returns a list of height readings
	GET /v1/human/height/readings/{id} Returns a specific height reading
	GET /v1/human/height/readings/daily/{date} Returns height readings for a specific date
	GET /v1/human/weight Returns the most recent weight reading
	GET /v1/human/weight/readings Returns a list of weight readings
	GET /v1/human/weight/readings/{id} Returns a specific weight reading
	GET /v1/human/weight/readings/daily/{date} Returns weight readings for a specific date
	GET /v1/human/activities Returns a list of activity segments
	GET /v1/human/activities/{id} Returns an activity by id
	GET /v1/human/activities/daily/{date} Returns a list of activity segments for a specific date
	GET /v1/human/activities/summary Returns summary of the most recent active minutes
	GET /v1/human/activities/summary/{date} Returns summary of the active minutes by a specific date
	GET /v1/human/locations Returns a list of location segments
	GET /v1/human/locations/{id} Returns a location by id
	GET /v1/human/locations/daily/{date} Returns a list of location segments for a specific date
	GET /v1/human/sleeps Returns a list of sleep segments
	GET /v1/human/sleeps/{id} Returns a location by id
	GET /v1/human/sleeps/daily/{date} Returns a list of sleep segments for a specific date
	GET /v1/human/sleeps/summary Returns a summary of the most recent sleep reading
	GET /v1/human/sleeps/summary/{date} Returns a summary of sleep readings for a specific date
	GET /v1/human/genetic/traits Returns the genetic traits of the human



OpenRMS Patient
	First/Last
	Birthdate + Estimated?
	Diagnoses
	Social Security Number
	ethnicity
	citizenship
	gender
	profession
	Domiciliary Unit
	education level
	marital status
	http://en.wikibooks.org/wiki/GNU_Health/Socioeconomics
	http://en.wikibooks.org/wiki/GNU_Health/Lifestyle
	http://en.wikibooks.org/wiki/GNU_Health/Gynecology_and_Obstetrics
	http://en.wikibooks.org/wiki/GNU_Health/Genetics
	http://en.wikibooks.org/wiki/GNU_Health/Surgery
	http://en.wikibooks.org/wiki/GNU_Health/Pediatrics


OpenRMS + GNUHeatlh Appointment / Visit
	Complaint / Reason
	Admission (includes Potential Admission = Appointment)
	Visit Note
	Diagnosis
	Discharge

OpenRMS Vitals
	Last Vitals: Today 12:35 PM
	Height (cm) 20.0cm
	Weight (kg) 23.0kg
	(Calculated) BMI 575.0
	Temperature © ____°C
	Pulse ____/min
	Respiratory rate ____/min
	Blood Pressure ____/____
	Blood oxygen saturation ____%

GNUHealth Laboratory Analysis
	...


OpenRMS Current Concept Classes
	Name 	Description
	Test 	Acq. during patient encounter (vitals, labs, etc.)
	Procedure 	Describes a clinical procedure
	Drug 	Drug
	Diagnosis 	Conclusion drawn through findings
	Finding 	Practitioner observation/finding
	Anatomy 	Anatomic sites / descriptors
	Question 	Question (eg, patient history, SF36 items)
	LabSet 	Term to describe laboratory sets
	MedSet 	Term to describe medication sets
	ConvSet 	Term to describe convenience sets
	Misc 	Terms which don't fit other categories
	Symptom 	Patient-reported observation
	Symptom/Finding 	Observation that can be reported from patient or found on exam
	Specimen 	Body or fluid specimen
	Misc Order 	Orderable items which aren't tests or drugs


OpenRMS Current Concept Datatypes
	Numeric 	Numeric value, including integer or float (e.g., creatinine, weight)
	Coded 	Value determined by term dictionary lookup (i.e., term identifier)
	Text 	Free text
	N/A 	Not associated with a datatype (e.g., term answers, sets)
	Document 	Pointer to a binary or text-based document (e.g., clinical document, RTF, XML, EKG, image, etc.) stored in complex_obs table
	Date 	Absolute date
	Time 	Absolute time of day
	Datetime 	Absolute date and time
	Boolean 	Boolean value (yes/no, true/false)
	Rule 	Value derived from other data
	Structured Numeric 	Complex numeric values possible (ie, <5, 1-10, etc.)
	Complex 	Complex value. Analogous to HL7 Embedded Datatype

https://www.hl7.org/implement/standards/

OpenRMS Concept Sources
 		SNOMED CT 		SNOMED Preferred mapping
		SNOMED NP 		Non-preferred SNOMED CT mappings
SNOMED Clinical Terms (SNOMED CT) is the most comprehensive, multilingual clinical healthcare terminology in the world.  
http://www.ihtsdo.org/snomed-ct/

		ICD-10-WHO 		ICD-10 WHO Version
		LOINC 		LOINC code
		PIH 		Equivalent concept ID in Master Partners-in-Health Concept dictionary
		PIH Malawi 		Partners in Health Malawi concept dictionary
		AMPATH 		AMPATH concept dictionary
		SNOMED MVP 		MVP Namespace Identifier extensions to SNOMED CT
		org.openmrs.module.mdrtb 		The required concepts for the MDR-TB module
		3BT 		Belgian Bilingual Bi-encoded Thesaurus (3BT)
		ICPC2 		International Classification of Primary Care version 2 from WONCA.
		CIEL 		Columbia International eHealth Laboratory concept ID
		org.openmrs.module.emrapi 		Reference application module
		IMO ProblemIT 		Intelligent Medical Objects, Inc. problem/disease/finding datasource
		IMO ProcedureIT 		Intelligent Medical Objects, Inc. procedure/test datasource



OpenRMS Administration
	Users

		Manage Users
		Manage Roles
		Manage Privileges
		Manage Alerts

	Patients

		Manage Patients
		Find Patients to Merge
		Manage Identifier Types
		Manage Patient Identifier Sources
		Auto-Generation Options
		View Log Entries

	Person

		Manage Persons
		Manage Relationship Types
		Manage Person Attribute Types

	Visits

		Manage Visit Types
		Manage Visit Attribute Types
		Configure Visits

	Encounters

		Manage Encounters
		Manage Encounter Types
		Manage Encounter Roles

	Providers

		Manage Providers
		Manage Provider Attribute Types

	Locations

		Manage Locations
		Manage Location Tags
		View Location Hierarchy
		Manage Location Attribute Types
		Manage Address Template

	Observations

		Manage Observations

	Orders

		Manage Orders
		Manage Drug Orders
		Manage Order Types

	Scheduler

		Manage Scheduler

	Programs

		Manage Programs
		Manage Triggered State Conversions

	
	Concepts

		View Concept Dictionary
		Manage Concept Drugs
		Manage Proposed Concepts
		Update Concept Index
		Manage Concept Classes
		Manage Concept Datatypes
		Manage Concept Sources
		Manage Concept Stop Word
		Manage Reference Terms

	Forms

		Manage Forms
		Manage Fields
		Manage Field Types
		Merge Duplicate Fields

	HL7 Messages

		Manage HL7 Sources
		Manage Queued Messages
		Manage Held Messages
		Manage HL7 Errors
		Manage HL7 Archives
		Migrate HL7 Archives

	Maintenance

		Set Implementation Id
		System Information
		View Quick Reports
		Settings
		Advanced Settings
		View Server Log
		View Database Changes
		Manage Locales And Themes
		View Logged In Users

	
	Modules

		Manage Modules
		Module Properties

	Logic Module

		Token Registration
		Rule Definitions
		Test Logic Expressions
		Initial Set-Up

	ID Generation

		Manage Patient Identifier Sources
		Auto-Generation Options
		View Log Entries

	Metadata Mapping

		Configure *required*

	Name Phonetics

		Configure Name Phonetics

	Calculation Module

		Manage Calculation Registrations

	HTML Form Entry

		Manage HTML Forms
		Preview HTML Form from File

	REST Web Services

		Settings
		Test
		Help

	Data Exchange Module

		Export
		Import

	Analysis & Reporting

		Report Dashboard
		Report Queue
		Report History
		Scheduled Reports
		Report Administration

	Manage Report Definitions

		Report Administration
		Data Set Definitions
		Indicator Definitions
		Dimension Definitions
		Cohort Queries
		Data Definitions
		Report Designs
		Report Processors

	Metadata Sharing

		Export Metadata
		Import Metadata
		Manage Tasks
		Configure

	Registration Core Module

		Manage module

	Provider Management Module

		Manage Provider Roles
		Manage Suggestions
		Manage Other Settings
		Provider Search


*/ 

