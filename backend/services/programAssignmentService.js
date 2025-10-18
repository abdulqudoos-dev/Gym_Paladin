const User = require('../models/User');
const Program = require('../models/Program');

class ProgramAssignmentService {
  /**
   * Assign program to user based on subscription tier
   */
  async assignProgramBySubscription(userId, subscriptionPlan) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Find programs assigned to this subscription tier
      const programs = await Program.find({
        'assignedTo.tiers': subscriptionPlan,
        status: 'published'
      }).sort({ createdAt: -1 });

      if (programs.length === 0) {
        console.log(`⚠️ No programs found for subscription tier: ${subscriptionPlan}`);
        return null;
      }

      // Assign the first available program
      const programToAssign = programs[0];
      user.assignedProgram = programToAssign._id;
      await user.save();

      console.log(`✅ Program "${programToAssign.title}" assigned to user ${user.email} (${subscriptionPlan})`);

      return programToAssign;
    } catch (error) {
      console.error('❌ Error assigning program by subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's assigned program based on subscription
   */
  async getUserAssignedProgram(userId) {
    try {
      const user = await User.findById(userId).populate('assignedProgram');
      
      if (!user) {
        throw new Error('User not found');
      }

      // If user has no assigned program, try to assign one based on subscription
      if (!user.assignedProgram && user.subscription.plan !== 'free') {
        const assignedProgram = await this.assignProgramBySubscription(userId, user.subscription.plan);
        return assignedProgram;
      }

      return user.assignedProgram;
    } catch (error) {
      console.error('❌ Error getting user assigned program:', error);
      throw error;
    }
  }

  /**
   * Handle subscription upgrade/downgrade
   */
  async handleSubscriptionChange(userId, oldPlan, newPlan) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // If upgrading or downgrading, reassign program
      if (newPlan !== 'free' && newPlan !== oldPlan) {
        const newProgram = await this.assignProgramBySubscription(userId, newPlan);
        
        if (newProgram) {
          console.log(`✅ User ${user.email} upgraded from ${oldPlan} to ${newPlan}, assigned program: ${newProgram.title}`);
        }
      } else if (newPlan === 'free') {
        // Remove program assignment for free users
        user.assignedProgram = null;
        await user.save();
        console.log(`✅ User ${user.email} downgraded to free, program assignment removed`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error handling subscription change:', error);
      throw error;
    }
  }

  /**
   * Get programs available for subscription tier
   */
  async getProgramsForTier(subscriptionTier) {
    try {
      const programs = await Program.find({
        'assignedTo.tiers': subscriptionTier,
        status: 'published'
      }).sort({ createdAt: -1 });

      return programs;
    } catch (error) {
      console.error('❌ Error getting programs for tier:', error);
      throw error;
    }
  }

  /**
   * Assign specific program to user (Admin function)
   */
  async assignSpecificProgram(userId, programId) {
    try {
      const user = await User.findById(userId);
      const program = await Program.findById(programId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!program) {
        throw new Error('Program not found');
      }

      user.assignedProgram = programId;
      await user.save();

      console.log(`✅ Program "${program.title}" manually assigned to user ${user.email}`);

      return { user, program };
    } catch (error) {
      console.error('❌ Error assigning specific program:', error);
      throw error;
    }
  }
}

module.exports = new ProgramAssignmentService();
