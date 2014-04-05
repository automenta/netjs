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


https://github.com/maccman/humanapi
	Human.profile
	Human.summary
	Human.all_activity
	Human.activity
	Human.daily_activity
	Human.series_activity
	Human.blood_glucose
	Human.all_blood_glucose
	Human.daily_blood_glucose
	Human.blood_pressure
	Human.all_blood_pressures
	Human.daily_blood_pressure
	Human.bmi
	Human.all_bmis
	Human.daily_bmi
	Human.body_fat
	Human.all_body_fats
	Human.daily_body_fat
	Human.genetic_traits
	Human.heart_rate
	Human.all_heart_rates
	Human.daily_heart_rate
	Human.height
	Human.all_heights
	Human.daily_height
	Human.all_locations
	Human.daily_location
	Human.sleep
	Human.all_sleep
	Human.daily_sleep
	Human.weight
	Human.all_weight
	Human.daily_weight

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

