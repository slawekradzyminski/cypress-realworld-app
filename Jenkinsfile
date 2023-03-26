pipeline {
    agent {
        docker {
            image 'cypress/browsers:node16.18.0-chrome107-ff106-edge'
        }
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('installation') {
            steps {
                sh 'yarn build:ci'
            }
        }
        stage('Start and wait for the application') {
            steps {
                sh './startAndWait.sh'
            }
        }
         stage('Run chrome desktop tests') {
            steps {
                sh "yarn cypress run --browser chrome --spec 'cypress/tests/ui/*'"
            }
        }
    }
}